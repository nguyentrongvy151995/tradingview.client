// Drawing Tools Implementation for Lightweight Charts
import { IChartApi, ISeriesApi, SeriesMarker, Time } from 'lightweight-charts';

export interface DrawingLine {
  id: string;
  type:
    | 'trendline'
    | 'horizontal'
    | 'vertical'
    | 'ray'
    | 'horizontal-line'
    | 'vertical-line';
  points: Array<{ time: Time; price: number }>;
  color: string;
  lineWidth: number;
}

export interface DrawingShape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle';
  points: Array<{ time: Time; price: number }>;
  color: string;
  fillColor?: string;
}

export interface DrawingText {
  id: string;
  time: Time;
  price: number;
  text: string;
  color: string;
  fontSize: number;
}

export class DrawingManager {
  private chart: IChartApi;
  private series: ISeriesApi<'Candlestick'>;
  private drawings: {
    lines: DrawingLine[];
    shapes: DrawingShape[];
    texts: DrawingText[];
  };
  private activeDrawing: any | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(chart: IChartApi, series: ISeriesApi<'Candlestick'>) {
    this.chart = chart;
    this.series = series;
    this.drawings = {
      lines: [],
      shapes: [],
      texts: [],
    };
    this.setupCanvas();
  }

  private setupCanvas() {
    // Create overlay canvas for drawings
    const chartContainer = (this.chart as any)._options.container;
    if (!chartContainer) return;

    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none'; // Allow click-through
    this.canvas.style.zIndex = '10';

    const rect = chartContainer.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      // Enable anti-aliasing for smoother lines
      this.ctx.imageSmoothingEnabled = true;
    }

    chartContainer.style.position = 'relative';
    chartContainer.appendChild(this.canvas);

    // Redraw on chart updates
    this.chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      this.redraw();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      const newRect = chartContainer.getBoundingClientRect();
      if (this.canvas) {
        this.canvas.width = newRect.width;
        this.canvas.height = newRect.height;
        this.canvas.style.width = `${newRect.width}px`;
        this.canvas.style.height = `${newRect.height}px`;
        this.redraw();
      }
    });
  }

  startDrawing(type: string, point: { time: Time; price: number }) {
    const id = `drawing-${Date.now()}`;

    switch (type) {
      case 'trendline':
      case 'horizontal-line':
      case 'vertical-line':
      case 'ray':
        this.activeDrawing = {
          id,
          type,
          points: [point],
          color: '#f7931a',
          lineWidth: 2,
        };
        break;
      case 'rectangle':
      case 'circle':
      case 'triangle':
        this.activeDrawing = {
          id,
          type,
          points: [point],
          color: '#f7931a',
          fillColor: 'rgba(247, 147, 26, 0.1)',
        };
        break;
    }
  }

  continueDrawing(point: { time: Time; price: number }) {
    if (!this.activeDrawing) return;

    if (this.activeDrawing.points.length === 1) {
      this.activeDrawing.points.push(point);
    } else {
      this.activeDrawing.points[1] = point;
    }

    this.redraw();
  }

  finishDrawing() {
    if (!this.activeDrawing) return;

    if (this.activeDrawing.points.length >= 2) {
      if (
        this.activeDrawing.type === 'trendline' ||
        this.activeDrawing.type === 'horizontal-line' ||
        this.activeDrawing.type === 'vertical-line' ||
        this.activeDrawing.type === 'ray'
      ) {
        this.drawings.lines.push(this.activeDrawing);
      } else {
        this.drawings.shapes.push(this.activeDrawing);
      }
    }

    this.activeDrawing = null;
    this.redraw();
  }

  private redraw() {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all saved drawings
    this.drawings.lines.forEach((line) => this.drawLine(line));
    this.drawings.shapes.forEach((shape) => this.drawShape(shape));

    // Draw active drawing
    if (this.activeDrawing) {
      if (
        this.activeDrawing.type === 'trendline' ||
        this.activeDrawing.type === 'horizontal-line' ||
        this.activeDrawing.type === 'vertical-line' ||
        this.activeDrawing.type === 'ray'
      ) {
        this.drawLine(this.activeDrawing);
      } else {
        this.drawShape(this.activeDrawing);
      }
    }
  }

  private drawLine(line: DrawingLine) {
    if (!this.ctx || line.points.length < 2) return;

    const coord1 = this.getCoordinates(line.points[0]);
    const coord2 = this.getCoordinates(line.points[1]);

    if (!coord1 || !coord2) return;

    this.ctx.strokeStyle = line.color;
    this.ctx.lineWidth = line.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();

    switch (line.type) {
      case 'trendline':
        this.ctx.moveTo(coord1.x, coord1.y);
        this.ctx.lineTo(coord2.x, coord2.y);
        // Draw selection circles at endpoints (like TradingView)
        this.drawCircle(coord1.x, coord1.y, 4, line.color);
        this.drawCircle(coord2.x, coord2.y, 4, line.color);
        break;
      case 'horizontal-line':
      case 'horizontal':
        this.ctx.moveTo(0, coord1.y);
        this.ctx.lineTo(this.canvas!.width, coord1.y);
        // Draw price label (like TradingView)
        this.drawPriceLabel(line.points[0].price, coord1.y, line.color);
        break;
      case 'vertical-line':
      case 'vertical':
        this.ctx.moveTo(coord1.x, 0);
        this.ctx.lineTo(coord1.x, this.canvas!.height);
        break;
      case 'ray':
        const dx = coord2.x - coord1.x;
        const dy = coord2.y - coord1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
          const extendLength = 10000;
          const extendX = coord1.x + (dx / length) * extendLength;
          const extendY = coord1.y + (dy / length) * extendLength;
          this.ctx.moveTo(coord1.x, coord1.y);
          this.ctx.lineTo(extendX, extendY);
          // Draw start point circle
          this.drawCircle(coord1.x, coord1.y, 4, line.color);
        }
        break;
    }

    this.ctx.stroke();
  }

  private drawCircle(x: number, y: number, radius: number, color: string) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawPriceLabel(price: number, y: number, color: string) {
    if (!this.ctx || !this.canvas) return;

    const text = price.toFixed(2);
    const padding = 4;
    const fontSize = 12;

    this.ctx.font = `${fontSize}px Arial`;
    const textWidth = this.ctx.measureText(text).width;

    const x = this.canvas.width - textWidth - padding * 2 - 10;
    const bgHeight = fontSize + padding * 2;

    // Background
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x - padding,
      y - bgHeight / 2,
      textWidth + padding * 2,
      bgHeight,
    );

    // Text
    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);
  }

  private drawShape(shape: DrawingShape) {
    if (!this.ctx || shape.points.length < 2) return;

    const coord1 = this.getCoordinates(shape.points[0]);
    const coord2 = this.getCoordinates(shape.points[1]);

    if (!coord1 || !coord2) return;

    this.ctx.strokeStyle = shape.color;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (shape.fillColor) {
      this.ctx.fillStyle = shape.fillColor;
    }

    switch (shape.type) {
      case 'rectangle':
        const width = coord2.x - coord1.x;
        const height = coord2.y - coord1.y;

        // Fill
        if (shape.fillColor) {
          this.ctx.fillRect(coord1.x, coord1.y, width, height);
        }

        // Stroke
        this.ctx.strokeRect(coord1.x, coord1.y, width, height);

        // Draw corner handles (like TradingView)
        this.drawCircle(coord1.x, coord1.y, 4, shape.color);
        this.drawCircle(coord2.x, coord2.y, 4, shape.color);
        this.drawCircle(coord1.x, coord2.y, 4, shape.color);
        this.drawCircle(coord2.x, coord1.y, 4, shape.color);
        break;

      case 'circle':
        const radius = Math.sqrt(
          Math.pow(coord2.x - coord1.x, 2) + Math.pow(coord2.y - coord1.y, 2),
        );

        this.ctx.beginPath();
        this.ctx.arc(coord1.x, coord1.y, radius, 0, 2 * Math.PI);

        if (shape.fillColor) {
          this.ctx.fill();
        }
        this.ctx.stroke();

        // Draw center and edge handles
        this.drawCircle(coord1.x, coord1.y, 4, shape.color);
        this.drawCircle(coord2.x, coord2.y, 4, shape.color);
        break;

      case 'triangle':
        const centerX = (coord1.x + coord2.x) / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(centerX, coord1.y);
        this.ctx.lineTo(coord1.x, coord2.y);
        this.ctx.lineTo(coord2.x, coord2.y);
        this.ctx.closePath();

        if (shape.fillColor) {
          this.ctx.fill();
        }
        this.ctx.stroke();

        // Draw corner handles
        this.drawCircle(centerX, coord1.y, 4, shape.color);
        this.drawCircle(coord1.x, coord2.y, 4, shape.color);
        this.drawCircle(coord2.x, coord2.y, 4, shape.color);
        break;
    }
  }

  private getCoordinates(point: { time: Time; price: number }) {
    try {
      const timeScale = this.chart.timeScale();

      const x = timeScale.timeToCoordinate(point.time);
      const y = this.series.priceToCoordinate(point.price);

      if (x === null || y === null) return null;

      return { x, y };
    } catch (error) {
      return null;
    }
  }

  clearAll() {
    this.drawings.lines = [];
    this.drawings.shapes = [];
    this.drawings.texts = [];
    this.redraw();
  }

  removeLastDrawing() {
    if (this.drawings.shapes.length > 0) {
      this.drawings.shapes.pop();
    } else if (this.drawings.lines.length > 0) {
      this.drawings.lines.pop();
    }
    this.redraw();
  }

  destroy() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
