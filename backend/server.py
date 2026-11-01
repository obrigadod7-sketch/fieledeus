@api_router.post("/ai/chat")
async def ai_chat(message_data: AIMessage, current_user: User = Depends(get_current_user)):
    try:
        question = (message_data.message or '').strip()
        if not question:
            raise HTTPException(status_code=400, detail='Mensagem vazia')

        language = (message_data.language or 'pt').lower()
        language_name = {
            'pt': 'português',
            'fr': 'francês',
            'en': 'inglês',
            'es': 'espanhol',
        }.get(language, 'português')

        providers = [
            (os.environ.get('OPENROUTER_API_KEY'), 'https://openrouter.ai/api/v1', os.environ.get('OPENROUTER_MODEL', 'google/gemma-4-31b-it:free')),
            (os.environ.get('GROQ_API_KEY'), 'https://api.groq.com/openai/v1', os.environ.get('GROQ_MODEL', 'openai/gpt-oss-120b')),
            (os.environ.get('OPENAI_API_KEY'), None, 'gpt-4o-mini'),
        ]
        providers = [p for p in providers if p[0]]

        pdf_processor.load_index()
        relevant_chunks = pdf_processor.search(question, k=5)
        guide_context = '\n\n'.join(relevant_chunks) if relevant_chunks else 'Sem informações específicas no guia Watizat.'

        system_message = (
            f"Você é o assistente virtual do Watizat, uma plataforma de ajuda para pessoas em diferentes regiões. "
            f"Responda em {language_name}. "
            "Seu objetivo é ajudar a pessoa a entender o problema, encontrar uma solução prática e agir com clareza. "
            "Você pode responder dúvidas sobre moradia, trabalho, alimentação, saúde, documentos, educação, apoio emocional, transporte, voluntariado, segurança, integração, comunicação, tecnologia, direitos e uso da plataforma. "
            "Não se limite a Paris; também ajude pessoas no Brasil, na Europa e em outras regiões. "
            "Se a pessoa não mencionar uma cidade ou país, responda de forma útil e geral, mas peça a região quando for importante para um detalhe específico. "
            "Sempre seja empático, direto e útil. "
            "Estruture a resposta em 3 partes: 1) diagnóstico breve, 2) ação prática passo a passo, 3) próximo passo recomendado. "
            "Se a pergunta for urgente, priorize segurança, documentação e contatos importantes. "
            "Se a pergunta não estiver no guia, responda com orientação generalista, sem inventar regras ou informações oficiais. "
            "Se o assunto for uso da plataforma, explique como criar pedido de ajuda, buscar voluntários, conversar com alguém, usar filtros e navegar nas áreas do app. "
            "Também pode ajudar a transformar um problema em um plano de ação claro e realista para o usuário."
        )

        if not providers:
            fallback_lines = []
            if relevant_chunks:
                fallback_lines.append('Com base no guia Watizat, aqui está um caminho útil:')
                for chunk in relevant_chunks[:3]:
                    summary = chunk.strip().replace('\n', ' ')
                    fallback_lines.append(f'• {summary[:400]}{"..." if len(summary) > 400 else ""}')
            fallback_lines.append('')
            fallback_lines.append('Se quiser, eu também posso te ajudar a:')
            fallback_lines.append('• encontrar uma solução prática para seu caso;')
            fallback_lines.append('• indicar o próximo passo mais importante;')
            fallback_lines.append('• sugerir como usar a plataforma para pedir ajuda ou oferecer apoio;')
            fallback_lines.append('• orientar em relação à sua região e ao tipo de problema que você está enfrentando.')
            context_response = '\n'.join(fallback_lines)
            chat_record = {
                'id': str(uuid.uuid4()),
                'user_id': current_user.id,
                'message': question,
                'response': context_response,
                'language': language,
                'ai_enabled': False,
                'created_at': datetime.now(timezone.utc).isoformat(),
            }
            await db.ai_chats.insert_one(chat_record)
            return {'response': context_response, 'sources': relevant_chunks[:2] if relevant_chunks else [], 'ai_enabled': False}

        system_message += f"\n\nContexto do guia Watizat relevante:\n{guide_context}"
        ai_response = None
        last_error = None
        for key, base_url, model in providers:
            try:
                client_ai = AsyncOpenAI(api_key=key, base_url=base_url) if base_url else AsyncOpenAI(api_key=key)
                response = await client_ai.chat.completions.create(
                    model=model,
                    messages=[
                        {'role': 'system', 'content': system_message},
                        {'role': 'user', 'content': question},
                    ],
                    temperature=0.7,
                    max_tokens=1000,
                )
                ai_response = response.choices[0].message.content
                break
            except Exception as e:
                last_error = e
                logging.warning(f'AI provider {base_url or "openai"} failed: {e}')

        if ai_response is None:
            raise last_error

        chat_record = {
            'id': str(uuid.uuid4()),
            'user_id': current_user.id,
            'message': question,
            'response': ai_response,
            'language': language,
            'ai_enabled': True,
            'created_at': datetime.now(timezone.utc).isoformat(),
        }
        await db.ai_chats.insert_one(chat_record)
        return {'response': ai_response, 'sources': relevant_chunks[:2] if relevant_chunks else [], 'ai_enabled': True}
    except Exception as e:
        logging.error(f'AI Chat error: {str(e)}')
        raise HTTPException(status_code=500, detail='Error processing message')
