import { Badge } from "@/components/ui/badge";

// Mapeamento de cores para seus valores visuais
const colorMap: Record<string, string> = {
  // Cores básicas
  preto: "#1a1a1a",
  branco: "#ffffff",
  vermelho: "#ef4444",
  azul: "#3b82f6",
  verde: "#22c55e",
  amarelo: "#eab308",
  rosa: "#ec4899",
  roxo: "#a855f7",
  laranja: "#f97316",
  marrom: "#92400e",
  cinza: "#6b7280",
  bege: "#d4a574",
  nude: "#e8c4a0",
  dourado: "#d4af37",
  prata: "#c0c0c0",
  vinho: "#722f37",
  coral: "#ff7f50",
  lilás: "#c8a2c8",
  turquesa: "#40e0d0",
  creme: "#fffdd0",
  caramelo: "#c68e17",
  mostarda: "#ffdb58",
  bordô: "#800020",
  terracota: "#cc4e00",
  off: "#faf9f6",
  "off white": "#faf9f6",
  "off-white": "#faf9f6",
  // Variações
  "azul marinho": "#000080",
  "azul claro": "#87ceeb",
  "verde escuro": "#006400",
  "verde claro": "#90ee90",
  "rosa claro": "#ffb6c1",
  "rosa escuro": "#c71585",
  "cinza claro": "#d3d3d3",
  "cinza escuro": "#4a4a4a",
};

function getColorValue(colorName: string): string {
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || "#9ca3af"; // fallback cinza
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

interface ColorBadgeProps {
  color: string;
  className?: string;
  showLabel?: boolean;
}

export function ColorBadge({ color, className = "", showLabel = true }: ColorBadgeProps) {
  const colorValue = getColorValue(color);
  const isLight = isLightColor(colorValue);

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1.5 bg-background border-border/60 ${className}`}
    >
      <span 
        className={`w-3 h-3 rounded-full flex-shrink-0 ${isLight ? 'border border-border' : ''}`}
        style={{ backgroundColor: colorValue }}
      />
      {showLabel && <span className="text-xs font-medium">{color}</span>}
    </Badge>
  );
}

interface ColorBadgeListProps {
  colors: string[];
  className?: string;
  maxColors?: number;
}

export function ColorBadgeList({ colors, className = "", maxColors = 4 }: ColorBadgeListProps) {
  const displayColors = colors.slice(0, maxColors);
  const remainingCount = colors.length - maxColors;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {displayColors.map((color, idx) => (
        <ColorBadge key={`${color}-${idx}`} color={color} />
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs bg-muted">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
