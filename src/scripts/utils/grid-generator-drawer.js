export default class GridGeneratorDrawer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    draw(shapeType, w, h, time, cellPos, textContent, fontFamily, fontSizeMultiplier) {
        switch (shapeType) {
            case 'circle':
                this._drawInnerCircle(w, h);
                break;
            case 'arc':
                // Arc animation is specific to the 'arc sweep' type
                this._drawInnerArc(w, h, time, cellPos.x, cellPos.y);
                break;
            case 'triangle':
                this._drawInnerTriangle(w, h);
                break;
            case 'word':
                this._drawInnerWord(w, h, textContent, fontFamily, fontSizeMultiplier);
                break;
            case 'truchet':
                this._drawTruchetTile(w, h);
                break;
            case 'rectangle':
            default:
                this._drawInnerRectangle(w, h);
                break;
        }
    }

    _drawInnerRectangle(w, h) {
        this.ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    _drawInnerCircle(w, h) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    _drawInnerArc(w, h, time, cellX, cellY) {
        this.ctx.beginPath();
        const angleOffset = (Math.sin(cellX * 0.02) + Math.cos(cellY * 0.02)) * Math.PI;
        const arcLength = ((Math.sin(cellX * 0.01 - cellY * 0.01) + 1) / 2) * 1.5 * Math.PI + 0.2 * Math.PI;
        const startAngle = angleOffset + time * 0.0005;
        const endAngle = startAngle + arcLength;
        this.ctx.arc(0, 0, Math.min(w, h) / 2, startAngle, endAngle, false);
        this.ctx.stroke();
    }

    _drawInnerTriangle(w, h) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, -h / 2);
        this.ctx.lineTo(-w / 2, h / 2);
        this.ctx.lineTo(w / 2, h / 2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    _drawInnerWord(w, h, text, font, sizeMultiplier) {
        const fontSize = Math.min(w / (text.length * 0.6 + 0.1), h * 0.8) * sizeMultiplier;
        this.ctx.font = `${fontSize}px ${font}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, 0, 0);
    }

    _drawTruchetTile(w, h) {
        this.ctx.save();
        this.ctx.lineWidth = this.ctx.lineWidth * 0.5; // Thinner lines for truchet
        this.ctx.beginPath();
        if (Math.random() > 0.5) {
            // Arc from top-left to bottom-right
            this.ctx.arc(-w / 2, -h / 2, w, 0, Math.PI / 2);
            this.ctx.moveTo(w / 2, h / 2);
            this.ctx.arc(w / 2, h / 2, w, Math.PI, Math.PI * 1.5);
        } else {
            // Arc from top-right to bottom-left
            this.ctx.arc(w / 2, -h / 2, w, Math.PI / 2, Math.PI);
            this.ctx.moveTo(-w / 2, h / 2);
            this.ctx.arc(-w / 2, h / 2, w, Math.PI * 1.5, Math.PI * 2);
        }
        this.ctx.stroke();
        this.ctx.restore();
    }
}