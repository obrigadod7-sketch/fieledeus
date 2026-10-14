---
*** Begin Patch
*** Update File: frontend/src/pages/AuthPage.js
@@
-    setLoading(true);
-
-    try {
-      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
-      const body = isLogin 
-        ? { email, password }
-        : { 
-            email, 
-            password, 
-            name, 
-            role, 
-            languages: ['pt', 'fr'],
-            ...(role === 'migrant' && {
-              need_categories: selectedCategories
-            }),
-            ...(role === 'helper' && {
-              help_categories: selectedCategories,
-              location: location ? { ...location, address: locationAddress } : null,
-              show_location: showLocation
-            }),
-            ...(role === 'volunteer' && {
-              professional_area: professionalArea,
-              professional_specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
-              availability,
-              experience
-            })
-          };
-
-      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, {
-        method: 'POST',
-        headers: { 'Content-Type': 'application/json' },
-        body: JSON.stringify(body)
-      });
-
-      const data = await response.json();
-
-      if (response.ok) {
-        login(data.token, data.user);
-        toast.success(isLogin ? 'Login bem-sucedido!' : 'Conta criada com sucesso!');
-        navigate('/home');
-      } else {
-        toast.error(data.detail || 'Erro ao autenticar');
-      }
-    } catch (error) {
-      toast.error('Erro de conexão');
-    } finally {
-      setLoading(false);
-    }
+    setLoading(true);
+
+    // adicionar timeout/AbortController para evitar travar o formulário
+    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
+    const body = isLogin
+      ? { email, password }
+      : {
+          email,
+          password,
+          name,
+          role,
+          languages: ['pt', 'fr'],
+          ...(role === 'migrant' && { need_categories: selectedCategories }),
+          ...(role === 'helper' && { help_categories: selectedCategories, location: location ? { ...location, address: locationAddress } : null, show_location: showLocation }),
+          ...(role === 'volunteer' && { professional_area: professionalArea, professional_specialties: specialties.split(',').map(s => s.trim()).filter(Boolean), availability, experience })
+        };
+
+    const controller = new AbortController();
+    const timeoutMs = 8000; // 8s timeout
+    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
+
+    try {
+      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, {
+        method: 'POST',
+        headers: { 'Content-Type': 'application/json' },
+        body: JSON.stringify(body),
+        signal: controller.signal
+      });
+
+      const data = await response.json();
+
+      if (response.ok) {
+        login(data.token, data.user);
+        toast.success(isLogin ? 'Login bem-sucedido!' : 'Conta criada com sucesso!');
+        navigate('/home');
+      } else {
+        toast.error(data.detail || 'Erro ao autenticar');
+      }
+    } catch (error) {
+      if (error.name === 'AbortError') {
+        toast.error('Tempo esgotado ao conectar com o servidor. Tente novamente.');
+      } else {
+        toast.error('Erro de conexão');
+        console.error('handleSubmit error:', error);
+      }
+    } finally {
+      clearTimeout(timeoutId);
+      setLoading(false);
+    }
*** End Patch
