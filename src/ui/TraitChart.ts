import { Genome, GenomeSnapshot } from '../types';

export class TraitChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private history: GenomeSnapshot[] = [];

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas with id '${canvasId}' not found`);
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }

    this.ctx = ctx;
  }

  updateHistory(history: GenomeSnapshot[]): void {
    this.history = history;
  }

  render(): void {
    if (this.history.length === 0) {
      this.drawEmptyState();
      return;
    }

    // Clear canvas
    this.ctx.fillStyle = '#fafafa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Get active traits from checkboxes
    const activeTraits = this.getActiveTraits();

    // Draw axes, grid, labels
    this.drawGraphAxes();

    // Draw trait lines
    for (const trait of activeTraits) {
      this.drawTraitLine(trait, 'male', this.getMaleColor(trait));
      this.drawTraitLine(trait, 'female', this.getFemaleColor(trait));
    }

    // Draw legend
    this.drawGenomeLegend(activeTraits);
  }

  private getActiveTraits(): (keyof Genome)[] {
    const traits: (keyof Genome)[] = ['maxHealth', 'strength', 'metabolism', 'greed', 'caution'];
    return traits.filter(trait => {
      const checkbox = document.getElementById(`show${this.capitalizeFirst(trait)}`) as HTMLInputElement;
      return checkbox && checkbox.checked;
    });
  }

  private drawTraitLine(
    trait: keyof Genome,
    sex: 'male' | 'female',
    color: string
  ): void {
    if (this.history.length === 0) return;

    // Scale Y-axis based on trait type
    const yScale = this.getYScale(trait, sex);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    for (let i = 0; i < this.history.length; i++) {
      const snapshot = this.history[i];
      const genome = sex === 'male' ? snapshot.maleAverage : snapshot.femaleAverage;
      const value = genome[trait];

      // Fix division by zero: when history.length === 1, use 0 for x position
      // Otherwise, calculate proportional position
      const x = this.history.length === 1
        ? 30  // Single point at left margin
        : (i / (this.history.length - 1)) * (this.canvas.width - 40) + 30;

      const y = this.canvas.height - 30 - (value / yScale) * (this.canvas.height - 50);

      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }

    this.ctx.stroke();
  }

  private getYScale(trait: keyof Genome, sex: 'male' | 'female'): number {
    if (this.history.length === 0) return 1;

    let maxValue = 0;
    for (const snapshot of this.history) {
      const genome = sex === 'male' ? snapshot.maleAverage : snapshot.femaleAverage;
      maxValue = Math.max(maxValue, genome[trait]);
    }

    // Add some padding to the scale
    return maxValue * 1.1 || 1;
  }

  private drawGraphAxes(): void {
    this.ctx.strokeStyle = '#999';
    this.ctx.lineWidth = 1;

    // Draw axes
    this.ctx.beginPath();
    this.ctx.moveTo(30, 20);
    this.ctx.lineTo(30, this.canvas.height - 30);
    this.ctx.lineTo(this.canvas.width - 10, this.canvas.height - 30);
    this.ctx.stroke();

    // Draw axis labels
    this.ctx.fillStyle = '#666';
    this.ctx.font = '10px sans-serif';
    this.ctx.textAlign = 'center';

    // X-axis labels
    this.ctx.fillText('Round 0', 30, this.canvas.height - 15);
    if (this.history.length > 1) {
      this.ctx.fillText(`Round ${this.history.length - 1}`, this.canvas.width - 10, this.canvas.height - 15);
    }
  }

  private drawGenomeLegend(activeTraits: (keyof Genome)[]): void {
    const legendX = this.canvas.width - 120;
    const legendY = 30;
    const itemHeight = 15;

    this.ctx.fillStyle = '#666';
    this.ctx.font = '10px sans-serif';
    this.ctx.textAlign = 'left';

    activeTraits.forEach((trait, index) => {
      const y = legendY + index * itemHeight;

      // Draw male color box
      this.ctx.fillStyle = this.getMaleColor(trait);
      this.ctx.fillRect(legendX, y, 10, 10);

      // Draw female color box
      this.ctx.fillStyle = this.getFemaleColor(trait);
      this.ctx.fillRect(legendX + 15, y, 10, 10);

      // Draw trait name
      this.ctx.fillStyle = '#666';
      this.ctx.fillText(this.capitalizeFirst(trait), legendX + 30, y + 8);
    });
  }

  private drawEmptyState(): void {
    this.ctx.fillStyle = '#fafafa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#999';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Waiting for data...', this.canvas.width / 2, this.canvas.height / 2);
  }

  private getMaleColor(trait: keyof Genome): string {
    const colors: Record<keyof Genome, string> = {
      maxHealth: '#0066cc',    // Dark blue
      strength: '#3399ff',     // Royal blue
      metabolism: '#66a3ff',   // Light blue
      greed: '#99c2ff',        // Pale blue
      caution: '#cce0ff'       // Very pale blue
    };
    return colors[trait] || '#000000';
  }

  private getFemaleColor(trait: keyof Genome): string {
    const colors: Record<keyof Genome, string> = {
      maxHealth: '#cc0066',    // Dark pink
      strength: '#ff3399',     // Hot pink
      metabolism: '#ff66a3',   // Light pink
      greed: '#ff99c2',        // Pale pink
      caution: '#ffcce0'       // Very pale pink
    };
    return colors[trait] || '#000000';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
