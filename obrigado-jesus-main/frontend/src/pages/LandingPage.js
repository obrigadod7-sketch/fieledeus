---
*** Begin Patch
*** Update File: obrigado-jesus-main/frontend/src/pages/LandingPage.js
@@
-import { Button } from '../components/ui/button';
+import { Button } from '../components/ui/button';
+import LoginButtons from '../../components/LoginButtons';
@@
-          <h1 
-            className="text-5xl md:text-7xl font-heading font-bold text-textPrimary mb-6"
-            data-testid="landing-title"
-          >
-            {t('welcome')}
-          </h1>
-          
-          <p className="text-xl md:text-2xl text-textSecondary mb-12 max-w-2xl mx-auto leading-relaxed">
-            Conectando migrantes e ajudantes em Paris. Encontre apoio, ofereça ajuda, construa comunidade.
-          </p>
+          <h1 
+            className="text-5xl md:text-7xl font-heading font-bold text-textPrimary mb-6"
+            data-testid="landing-title"
+          >
+            Bem-vindo ao Watizat
+          </h1>
+          
+          <p className="text-xl md:text-2xl text-textSecondary mb-12 max-w-2xl mx-auto leading-relaxed">
+            Conectando migrantes e ajudantes em Paris. Encontre apoio, ofereça ajuda, construa comunidade.
+          </p>
@@
-              <h2 className="text-2xl font-heading font-bold text-textPrimary mb-3">
-                {t('needHelp')}
-              </h2>
-              <p className="text-textSecondary">
-                Encontre ajuda com trabalho, moradia, alimentação, serviços jurídicos e mais.
-              </p>
+              <h2 className="text-2xl font-heading font-bold text-textPrimary mb-3">
+                Preciso de Ajuda
+              </h2>
+              <p className="text-textSecondary">
+                Encontre ajuda com trabalho, moradia, alimentação, serviços jurídicos e mais.
+              </p>
@@
-              <h2 className="text-2xl font-heading font-bold text-textPrimary mb-3">
-                {t('wantToHelp')}
-              </h2>
-              <p className="text-textSecondary">
-                Ofereça seu apoio, compartilhe recursos e faça a diferença na vida de alguém.
-              </p>
+              <h2 className="text-2xl font-heading font-bold text-textPrimary mb-3">
+                Quero Ajudar
+              </h2>
+              <p className="text-textSecondary">
+                Ofereça seu apoio, compartilhe recursos e faça a diferença na vida de alguém.
+              </p>
@@
-            <p className="text-textMuted mb-4">Já tem uma conta?</p>
-            <Button 
-              data-testid="login-button"
-              onClick={() => navigate('/auth')}
-              variant="outline"
-              className="rounded-full px-8 py-6 text-lg"
-            >
-              {t('login')}
-            </Button>
+            <p className="text-textMuted mb-4">Já tem uma conta?</p>
+            <LoginButtons className="justify-center" />
           </div>
*** End Patch
