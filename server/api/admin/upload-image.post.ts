import { getAdminStorage } from '~/server/utils/firebaseAdmin'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

export default defineEventHandler(async (event) => {
  // Leer los archivos del form-data usando readMultipartFormData
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No se envió ningún archivo' })
  }

  const filePart = formData.find((part) => part.name === 'file')
  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({ statusCode: 400, message: 'Archivo inválido' })
  }

  try {
    const bucket = getAdminStorage().bucket()
    
    // Procesar la imagen con sharp: Redimensionar y convertir a WebP
    // Esto optimiza drásticamente las imágenes para Lighthouse
    const processedImageBuffer = await sharp(filePart.data)
      .resize({ 
        width: 1200, // Ancho máximo ideal para web/headers
        withoutEnlargement: true // No estirar imágenes más pequeñas
      })
      .webp({ quality: 80 }) // Formato WebP ultra-ligero y moderno
      .toBuffer()

    // Siempre guardamos como webp para maximizar optimización
    const uniqueFileName = `uploads/${uuidv4()}.webp`
    
    const file = bucket.file(uniqueFileName)

    // Guardar en Firebase Storage (Admin SDK)
    await file.save(processedImageBuffer, {
      metadata: {
        contentType: 'image/webp',
      },
      public: true, // Hacer que el archivo sea de lectura pública
    })

    // URL pública directa desde Google Cloud Storage
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`

    return { url: publicUrl }
  } catch (error) {
    console.error('[POST /api/admin/upload-image]', error)
    throw createError({ statusCode: 500, message: 'Error al subir y procesar la imagen' })
  }
})
