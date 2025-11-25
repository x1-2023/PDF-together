import React from 'react';
import { X, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ToolType } from '@/types';

const COLORS = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#FFA500', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#0000FF', // Blue
    '#800080', // Purple
];

const STICKY_COLORS = [
    { name: 'Pink', bg: '#FFC1CC', border: '#FF69B4' },
    { name: 'Yellow', bg: '#FEF3C7', border: '#FBBF24' },
    { name: 'Green', bg: '#D1FAE5', border: '#10B981' },
    { name: 'Cyan', bg: '#CFFAFE', border: '#06B6D4' },
    { name: 'Peach', bg: '#FFE4CC', border: '#FB923C' },
    { name: 'Purple', bg: '#E9D5FF', border: '#A855F7' },
    { name: 'Lavender', bg: '#DDD6FE', border: '#8B5CF6' },
    { name: 'White', bg: '#FFFFFF', border: '#D1D5DB' },
];

interface ToolSettingsPanelProps {
    onClose: () => void;
}

export const ToolSettingsPanel: React.FC<ToolSettingsPanelProps> = ({ onClose }) => {
    const {
        activeTool,
        activeColor,
        setActiveColor,
        brushSize,
        setBrushSize,
        highlighterSize,
        setHighlighterSize,
        eraserSize,
        setEraserSize,
        fontSize,
        setFontSize,
        textAlignment,
        setTextAlignment,
        stickyColor,
        setStickyColor,
    } = useUIStore();

    if (activeTool === ToolType.CURSOR || activeTool === ToolType.MOVE || activeTool === ToolType.AI) {
        return null; // No settings for these tools
    }

    return (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-background border-2 border-border rounded-2xl shadow-2xl p-4 flex items-center gap-4 z-50">
            {/* Close button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full"
            >
                <X className="h-4 w-4" />
            </Button>

            {/* Pen Settings */}
            {activeTool === ToolType.PEN && (
                <>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Size:</span>
                        <Slider
                            value={[brushSize]}
                            onValueChange={(value) => setBrushSize(value[0])}
                            min={1}
                            max={20}
                            step={1}
                            className="w-32"
                        />
                        <span className="text-sm font-medium w-8">{brushSize}px</span>
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div className="flex items-center gap-2">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => setActiveColor(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${activeColor === color ? 'border-primary scale-110' : 'border-border'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Highlighter Settings */}
            {activeTool === ToolType.HIGHLIGHT && (
                <>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Size:</span>
                        <Slider
                            value={[highlighterSize]}
                            onValueChange={(value) => setHighlighterSize(value[0])}
                            min={10}
                            max={40}
                            step={2}
                            className="w-32"
                        />
                        <span className="text-sm font-medium w-8">{highlighterSize}px</span>
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div className="flex items-center gap-2">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => setActiveColor(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${activeColor === color ? 'border-primary scale-110' : 'border-border'
                                    }`}
                                style={{ backgroundColor: color, opacity: 0.5 }}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Eraser Settings */}
            {activeTool === ToolType.ERASER && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Size:</span>
                    <Slider
                        value={[eraserSize]}
                        onValueChange={(value) => setEraserSize(value[0])}
                        min={10}
                        max={100}
                        step={5}
                        className="w-32"
                    />
                    <span className="text-sm font-medium w-12">{eraserSize}px</span>
                </div>
            )}

            {/* Text Settings */}
            {activeTool === ToolType.TEXT && (
                <>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Size:</span>
                        <Slider
                            value={[fontSize]}
                            onValueChange={(value) => setFontSize(value[0])}
                            min={12}
                            max={48}
                            step={2}
                            className="w-32"
                        />
                        <span className="text-sm font-medium w-8">{fontSize}px</span>
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div className="flex items-center gap-2">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => setActiveColor(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${activeColor === color ? 'border-primary scale-110' : 'border-border'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div className="flex items-center gap-1">
                        <Button
                            variant={textAlignment === 'left' ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => setTextAlignment('left')}
                            className="h-8 w-8"
                        >
                            <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={textAlignment === 'center' ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => setTextAlignment('center')}
                            className="h-8 w-8"
                        >
                            <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={textAlignment === 'right' ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => setTextAlignment('right')}
                            className="h-8 w-8"
                        >
                            <AlignRight className="h-4 w-4" />
                        </Button>
                    </div>
                </>
            )}

            {/* Sticky Note Settings */}
            {activeTool === ToolType.STICKY && (
                <div className="flex items-center gap-2">
                    {STICKY_COLORS.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setStickyColor(color.bg)}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${stickyColor === color.bg ? 'scale-110 shadow-lg' : ''
                                }`}
                            style={{
                                backgroundColor: color.bg,
                                borderColor: color.border,
                            }}
                            title={color.name}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
