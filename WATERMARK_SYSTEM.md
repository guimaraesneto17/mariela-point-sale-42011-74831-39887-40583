# Sistema de Watermark Automático

Sistema automático de proteção de imagens de produtos com marca d'água (watermark) da empresa.

## 📋 Visão Geral

O sistema aplica automaticamente o logo da empresa como marca d'água em todas as imagens de produtos carregadas no sistema, protegendo-as contra uso não autorizado.

## 🎯 Funcionalidades

### 1. Aplicação Automática
- **Processamento automático**: Watermark aplicado durante o upload
- **Invisibilidade sutil**: Opacidade de 30% para não interferir na visualização
- **Posicionamento estratégico**: Canto inferior direito por padrão
- **Escala proporcional**: Logo ajustado automaticamente ao tamanho da imagem

### 2. Configurações Personalizáveis

```typescript
interface WatermarkConfig {
  enabled: boolean;          // Ativar/desativar watermark
  logoPath: string;          // Caminho do logo
  opacity: number;           // Opacidade (0.0 a 1.0)
  position: string;          // Posicionamento
  scale: number;             // Escala em relação à imagem
  margin: number;            // Margem em pixels
}
```

### 3. Posições Disponíveis
- `center`: Centro da imagem
- `top-left`: Canto superior esquerdo
- `top-right`: Canto superior direito
- `bottom-left`: Canto inferior esquerdo
- `bottom-right`: Canto inferior direito (padrão)

## 🔧 Implementação Técnica

### Fluxo de Processamento

1. **Upload de Imagem** → 2. **Aplicação de Watermark** → 3. **Compressão Multi-Versão** → 4. **Armazenamento**

```
Original (base64) 
    ↓
Conversão para Buffer
    ↓
Aplicação de Watermark (Sharp)
    ↓
Compressão em 3 versões:
  - Thumbnail (200px)
  - Medium (800px)  
  - Full (1920px)
    ↓
Upload para Supabase Storage
```

### Código de Exemplo

```typescript
// Aplicar watermark com configurações personalizadas
const watermarkedBuffer = await addWatermark(originalBuffer, {
  enabled: true,
  opacity: 0.3,
  position: 'bottom-right',
  scale: 0.15,
  margin: 20
});
```

## 📊 Configuração Padrão

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `enabled` | `true` | Watermark ativado por padrão |
| `opacity` | `0.3` | 30% de opacidade |
| `position` | `bottom-right` | Canto inferior direito |
| `scale` | `0.15` | Logo ocupa 15% da largura |
| `margin` | `20px` | 20 pixels de margem |
| `logoPath` | `/public/logo.png` | Logo da empresa |

## 🛡️ Proteção de Imagens

### Benefícios
- ✅ **Proteção de marca**: Logo visível em todas as imagens
- ✅ **Dissuasão de cópia**: Dificulta uso não autorizado
- ✅ **Rastreabilidade**: Identifica origem das imagens
- ✅ **Profissionalismo**: Reforça identidade visual

### Características de Segurança
- Watermark aplicado no servidor (backend)
- Impossível remover sem acesso ao sistema
- Integrado ao processo de upload
- Aplicado antes da compressão

## 🎨 Otimização Visual

### Técnicas Utilizadas
1. **Opacidade ajustável**: Equilíbrio entre visibilidade e discrição
2. **Posicionamento inteligente**: Evita áreas críticas da imagem
3. **Escala responsiva**: Logo proporcional ao tamanho da imagem
4. **Margem de segurança**: Afastamento das bordas

### Performance
- Processamento rápido com Sharp
- Não impacta significativamente o tempo de upload
- Aplicado uma vez durante o upload
- Cache de logo para melhor performance

## 🔄 Integração com Sistema de Compressão

O watermark é aplicado **antes** da compressão em múltiplas versões:

```
1. Upload → 2. Watermark → 3. Compressão → 4. Storage
                ↓
        Buffer com marca d'água
                ↓
        Thumbnail (200px) ✓
        Medium (800px) ✓
        Full (1920px) ✓
```

**Vantagem**: Todas as três versões (thumbnail, medium, full) recebem o watermark automaticamente.

## 📝 Gerenciamento de Configuração

### API de Configuração

```typescript
import { watermarkConfig } from './lib/pdfWatermark';

// Desativar watermark temporariamente
watermarkConfig.setEnabled(false);

// Ajustar opacidade
watermarkConfig.setOpacity(0.5); // 50%

// Mudar posição
watermarkConfig.setPosition('center');

// Ajustar escala
watermarkConfig.setScale(0.2); // 20% da largura

// Obter configuração atual
const config = watermarkConfig.getConfig();
```

### Validação de Configuração
- **Opacidade**: Limitada entre 0.0 e 1.0
- **Escala**: Limitada entre 0.05 (5%) e 0.5 (50%)
- **Logo**: Verificação de existência do arquivo
- **Fallback**: Retorna imagem original se houver erro

## 🚨 Tratamento de Erros

### Cenários Cobertos
1. **Logo não encontrado**: Warning e imagem sem watermark
2. **Erro no Sharp**: Retorna imagem original
3. **Buffer inválido**: Exceção tratada
4. **Configuração inválida**: Valores padrão aplicados

### Logs de Monitoramento
```
✅ Watermark aplicado com sucesso
⚠️  Logo file not found - skipping watermark
❌ Error adding watermark: [error details]
```

## 📈 Casos de Uso

### 1. E-commerce
- Proteger fotos de produtos
- Evitar uso não autorizado por concorrentes
- Manter identidade visual

### 2. Catálogos Digitais
- Watermark em imagens de catálogo
- Distribuição segura de materiais
- Controle de uso de imagens

### 3. Redes Sociais
- Imagens compartilháveis com marca
- Rastreamento de origem
- Marketing visual

## 🔮 Próximos Passos

### Melhorias Futuras
- [ ] Interface de configuração no frontend
- [ ] Múltiplos estilos de watermark
- [ ] Watermark dinâmico (texto + logo)
- [ ] Posicionamento baseado em detecção de conteúdo
- [ ] Watermark diferentes por categoria de produto
- [ ] Analytics de uso de imagens com watermark

### Funcionalidades Avançadas
- [ ] Watermark invisível (steganografia)
- [ ] QR Code como watermark
- [ ] Watermark animado para GIFs
- [ ] Remoção de watermark com senha (para uso interno)

## 📚 Referências

- **Sharp**: Biblioteca de processamento de imagens
- **Supabase Storage**: Armazenamento de imagens
- **Buffer**: Manipulação de dados binários
- **Composite**: Técnica de sobreposição de imagens

---

**Nota**: O sistema de watermark é totalmente automático e não requer intervenção manual. Todas as imagens carregadas no sistema recebem a marca d'água automaticamente durante o processo de upload.
