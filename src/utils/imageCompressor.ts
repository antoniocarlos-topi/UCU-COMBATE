// ==============================================================================
// U.C.U ARENA — UTILITÁRIO DE COMPRESSÃO E PROCESSAMENTO DE IMAGEM NO CLIENTE
// Redimensionamento, conversão para WebP e validação estrita de segurança
// ==============================================================================

export interface ImageProcessingResult {
  file: File;
  previewUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
}

const MAX_OUTPUT_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB (Limite estrito do Supabase Storage)
const TARGET_DIMENSION = 800; // 800x800px máximo para avatares de combate
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Valida o arquivo bruto selecionado pelo atleta
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato de imagem não suportado. Por favor, utilize JPG, PNG ou WebP.',
    };
  }

  // Limite preventivo do arquivo bruto antes da compressão (15 MB)
  if (file.size > 15 * 1024 * 1024) {
    return {
      valid: false,
      error: 'O arquivo original é muito pesado. Selecione uma imagem de até 15 MB.',
    };
  }

  return { valid: true };
}

/**
 * Comprime e converte qualquer imagem para WebP otimizada no próprio navegador
 */
export async function processAndCompressAthleteAvatar(
  file: File,
  authUserId: string = 'temp'
): Promise<ImageProcessingResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem no dispositivo.'));

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Falha ao decodificar a imagem selecionada.'));

      img.onload = () => {
        // Cálculo de redimensionamento proporcional mantendo a proporção 1:1 de combate
        let width = img.width;
        let height = img.height;

        // Se for maior que TARGET_DIMENSION, redimensiona
        if (width > TARGET_DIMENSION || height > TARGET_DIMENSION) {
          if (width > height) {
            height = Math.round((height * TARGET_DIMENSION) / width);
            width = TARGET_DIMENSION;
          } else {
            width = Math.round((width * TARGET_DIMENSION) / height);
            height = TARGET_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível inicializar o processador de imagem canvas.'));
          return;
        }

        // Renderiza com suavização de alta fidelidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Exporta em formato WebP a 85% de qualidade (excelente relação peso/nitidez)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha na conversão para formato WebP.'));
              return;
            }

            if (blob.size > MAX_OUTPUT_SIZE_BYTES) {
              reject(
                new Error(
                  `A foto resultante (${(blob.size / (1024 * 1024)).toFixed(2)} MB) excedeu o limite máximo permitido de 2 MB.`
                )
              );
              return;
            }

            const timestamp = Date.now();
            const fileName = `avatar_${authUserId}_${timestamp}.webp`;
            const compressedFile = new File([blob], fileName, { type: 'image/webp' });
            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: compressedFile,
              previewUrl,
              originalSizeKb: Math.round(file.size / 1024),
              compressedSizeKb: Math.round(blob.size / 1024),
              width,
              height,
            });
          },
          'image/webp',
          0.85
        );
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
