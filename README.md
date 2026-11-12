# Clonador de voz

Web para generar audio con una voz de referencia (XTTS v2).

- **Frontend** (esta carpeta): Next.js, se despliega en Vercel.
- **Backend** (`colab/voice_clone_backend.ipynb`): notebook de Google Colab que corre el modelo con GPU gratis y expone una URL pública.

El navegador llama directo al backend, así Vercel solo sirve la página.

## Uso

1. Abrí el notebook en Colab: https://colab.research.google.com/github/carlosfontans72cf-droid/voice-clone-app/blob/main/colab/voice_clone_backend.ipynb
   (si el repo es privado: bajá el `.ipynb` y subilo en **Archivo → Subir cuaderno**).
2. **Entorno de ejecución → Cambiar tipo de entorno de ejecución → GPU (T4)**.
3. **Ejecutar todo**. Al final aparece una URL que termina en `.gradio.live`.
4. Abrí la web, pegá esa URL, subí el audio de referencia, escribí el texto y generá.

La URL de Colab dura hasta 72 horas y cambia cada vez que ejecutás el notebook.

## Correrlo en tu compu

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## Deploy en Vercel

Importá este repo en https://vercel.com/new y hacé Deploy. No hace falta ninguna variable de entorno
(opcional: `NEXT_PUBLIC_BACKEND_URL` con una URL de backend por defecto).

## Notas

- La licencia del modelo XTTS v2 (Coqui CPML) no permite uso comercial.
- Usá solo tu voz o la de alguien que te dio permiso.
