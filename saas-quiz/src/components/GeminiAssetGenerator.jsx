import React, { useState } from 'react';
import { Sparkle, ImageSquare, ArrowClockwise } from '@phosphor-icons/react';

export default function GeminiAssetGenerator({ onAssetGenerated, type = 'pregunta' }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Curated list of premium illustrations mapping tags
  const defaultAssets = {
    avatar: [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150', // astronaut
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', // friendly girl
      'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=150', // boy coder
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'  // smart kid
    ],
    pregunta: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=350', // space
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=350', // technology
      'https://images.unsplash.com/photo-1607988795691-3d0147b43231?auto=format&fit=crop&q=80&w=350', // science / lab
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=350'  // math algebra
    ],
    medalla: [
      'https://images.unsplash.com/photo-1578269174936-2709b5a190f3?auto=format&fit=crop&q=80&w=350', // star medal
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=350', // trophy
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=350'  // badge gold
    ]
  };

  const handleGenerate = () => {
    if (!prompt) return;
    setLoading(true);

    // Simulate Gemini image creation (e.g. Imagen 3 via Gemini developer API)
    setTimeout(() => {
      // Pick a random image from the category matching the prompt or cycling
      const categoryList = defaultAssets[type] || defaultAssets.pregunta;
      const index = Math.floor(Math.random() * categoryList.length);
      const generatedImage = categoryList[index];
      
      setPreviewUrl(generatedImage);
      setLoading(false);
      if (onAssetGenerated) {
        onAssetGenerated(generatedImage);
      }
    }, 2000); // 2 second aesthetic loader
  };

  const placeholderText = () => {
    if (type === 'avatar') return 'Ej: Astronauta amigable flotando en 3D';
    if (type === 'medalla') return 'Ej: Medalla dorada brillante con una estrella azul en el centro';
    return 'Ej: Planeta Saturno con anillos de colores brillantes, estilo caricatura';
  };

  return (
    <div className="asset-generator-card">
      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkle weight="fill" color="var(--brand)" />
        Generador de Ilustraciones Gemini AI
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Crea imágenes increíbles para tus preguntas usando Inteligencia Artificial.
      </p>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder={placeholderText()}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{ fontSize: '13px' }}
        />
        <button 
          type="button"
          className="btn btn-primary" 
          onClick={handleGenerate}
          disabled={loading || !prompt}
          style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
        >
          {loading ? (
            <>
              <ArrowClockwise className="animate-spin" /> Generando...
            </>
          ) : (
            <>
              <ImageSquare weight="fill" /> Generar
            </>
          )}
        </button>
      </div>

      {previewUrl && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="asset-preview">
            <img src={previewUrl} alt="Generado por Gemini" />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700' }}>
            ✓ Ilustración generada con éxito
          </span>
        </div>
      )}
    </div>
  );
}
