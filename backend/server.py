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
            (os.environ.get('OPENROUTER_API_KEY'), "https://openrouter.ai/api/v1", os.environ.get('OPENROUTER_MODEL', 'google/gemma-4-31b-it:free')),
            (os.environ.get('GROQ_API_KEY'), "https://api.groq.com/openai/v1", os.environ.get('GROQ_MODEL', 'openai/gpt-oss-120b')),
            (os.environ.get('OPENAI_API_KEY'), None, 'gpt-4o-mini'),
        ]
        providers = [p for p in providers if p[0]]

        pdf_processor.load_index()
        relevant_chunks = pdf_processor.search(question, k=4)
        guide_context = "\n\n".join(relevant_chunks) if relevant_chunks else "Sem informações específicas no guia Watizat."

        system_message = (
            f"Você é o assistente virtual do Watizat, uma plataforma de ajuda para pessoas em diferentes regiões. "
            f"Responda em {language_name}. "
            "Seja empático, útil, direto e objetivo. "
            "Você pode responder dúvidas sobre moradia, trabalho, alimentação, saúde, documentos, estudo, apoio emocional, comunicação, integração, legislação, transporte, voluntariado e qualquer tema relacionado a ajuda comunitária. "
            "Não se limite a Paris ou a um único país; ajude também na Europa, no Brasil e em outras regiões. "
            "Se a pergunta não estiver no guia, responda de forma geral e útil, sem inventar fatos. "
            "Quando necessário, sugira passos práticos, opções de busca e ações concretas para a pessoa prosseguir. "
            "Também pode orientar sobre como usar a plataforma, como criar pedidos, buscar ajuda, entrar em contato ou navegar pela aplicação."
        )

        if not providers:
            if relevant_chunks:
                context_response = (
                    "Com base no guia Watizat, aqui vai uma resposta útil:\n\n"
                    + "\n\n".join([f"• {chunk[:400]}" + ("..." if len(chunk) > 400 else "") for chunk in relevant_chunks[:3]])
                    + "\n\nSe quiser, posso ajudar com mais detalhes sobre moradia, emprego, saúde, documentação, alimentação ou suporte na sua região."
                )
            else:
                context_response = (
                    "Posso ajudar com muitas coisas: moradia, trabalho, alimentação, saúde, documentos, educação, apoio emocional e dúvidas sobre a plataforma. "
                    "Se você me disser a sua região e o que precisa, eu consigo orientar de forma mais precisa."
                )
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
                    max_tokens=800,
                )
                ai_response = response.choices[0].message.content
                break
            except Exception as e:
                last_error = e
                logging.warning(f"AI provider {base_url or 'openai'} failed: {e}")
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
        logging.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing message")
