import { CanvasCoords, WorldCoords } from '../../utils/Coordinates';
import { HatType, hatFromType } from '../../utils/Hats';
import Viewport from '../board/Viewport';
import CanvasRenderer from './CanvasRenderer';
import { engineConsts } from './utils/EngineConsts';
import { TextAlign } from './utils/EngineTypes';

/* this is mostly migration code from the old renderer; it holds all of the old renderer primitives,
   but most of them have been re-implemented in GL. still useful for debugging sometimes - draws
   to the canvas2d canvas, which sits above the webgl canvas.
 */

export default class CanvasManager {
  renderer: CanvasRenderer;
  canvas: HTMLCanvasElement;

  ctx: CanvasRenderingContext2D;

  constructor(engine: CanvasRenderer, canvas: HTMLCanvasElement) {
    this.renderer = engine;
    this.canvas = canvas;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      console.error('error getting draw context');
      return;
    }

    this.ctx = ctx;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  drawRectStrokeAtCenterWorld(
    center: WorldCoords,
    width: number,
    height: number,
    strokeWidth: number,
    color = 'white'
  ) {
    const viewport = Viewport.getInstance();

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const widthCanvasCoords = viewport.worldToCanvasDist(width);
    const heightCanvasCoords = viewport.worldToCanvasDist(height);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.strokeRect(
      centerCanvasCoords.x - widthCanvasCoords / 2,
      centerCanvasCoords.y - heightCanvasCoords / 2,
      widthCanvasCoords,
      heightCanvasCoords
    );
  }
  drawHat(
    hatType: HatType,
    pathHeight: number,
    pathWidth: number,
    center: WorldCoords,
    width: number,
    height: number,
    radius: number,
    rotation: number,
    fill1: string | CanvasPattern = 'white',
    fill2: string | CanvasPattern = 'red'
  ) {
    const { ctx } = this;
    const viewport = Viewport.getInstance();
    const hat = hatFromType(hatType);

    const trueCenter = viewport.worldToCanvasCoords(center);
    const trueRadius = viewport.worldToCanvasDist(radius);
    const trueWidth = viewport.worldToCanvasDist(width);
    const trueHeight = viewport.worldToCanvasDist(height);

    ctx.save();

    // move to planet center
    ctx.translate(trueCenter.x, trueCenter.y);

    // extrude out to outside
    ctx.rotate(rotation);
    ctx.translate(0, -trueRadius - trueHeight / 4);

    // move to svg center
    ctx.scale(trueWidth / pathWidth, trueHeight / pathHeight);
    ctx.translate(-pathWidth / 2, -pathHeight / 2);

    ctx.fillStyle = fill1;
    for (const pathStr of hat.bottomLayer) {
      ctx.fill(new Path2D(pathStr));
    }

    ctx.fillStyle = fill2;
    for (const pathStr of hat.topLayer) {
      ctx.fill(new Path2D(pathStr));
    }

    ctx.restore();
  }

  drawLoopWorld(
    center: WorldCoords,
    radius: number,
    width: number,
    color = 'white',
    dotted = false
  ) {
    this.drawArcWorld(center, radius, width, 100, color, dotted);
  }

  drawArcWorld(
    center: WorldCoords,
    radius: number,
    width: number,
    percent: number,
    color = 'white',
    dotted = false
  ) {
    const viewport = Viewport.getInstance();

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const radiusCanvasCoords = viewport.worldToCanvasDist(radius);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    this.ctx.strokeStyle = color;
    // this.ctx.lineWidth = viewport.worldToCanvasDist(width);
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.arc(
      centerCanvasCoords.x,
      centerCanvasCoords.y,
      radiusCanvasCoords,
      1.5 * Math.PI,
      1.5 * Math.PI + (2 * Math.PI * percent) / 100,
      false
    );

    if (dotted) this.ctx.setLineDash([15, 15]);
    else this.ctx.setLineDash([]);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  drawLine(
    startCoords: WorldCoords,
    endCoords: WorldCoords,
    lineWidth: number,
    color = 'white',
    dotted = false
  ) {
    const viewport = Viewport.getInstance();

    this.ctx.beginPath();
    // this.ctx.lineWidth = viewport.worldToCanvasDist(lineWidth);
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    const startCanvasCoords: CanvasCoords = viewport.worldToCanvasCoords(
      startCoords
    );
    this.ctx.moveTo(startCanvasCoords.x, startCanvasCoords.y);
    const endCanvasCoords: CanvasCoords = viewport.worldToCanvasCoords(
      endCoords
    );
    this.ctx.lineTo(endCanvasCoords.x, endCanvasCoords.y);

    if (dotted) this.ctx.setLineDash([15, 15]);
    else this.ctx.setLineDash([]);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  drawText(
    text: string,
    x: number,
    y: number,
    color = 'white',
    align: TextAlign = TextAlign.Center
  ) {
    this.ctx.font = engineConsts.fontStyle;
    // this.ctx.textBaseline = 'middle';
    if (align === TextAlign.Center) {
      this.ctx.textAlign = 'center';
    } else {
      // no-op
      this.ctx.textAlign = 'center';
    }
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }

  drawArtifactIcon(glassLoc: WorldCoords) {
    const { ctx } = this;

    const viewport = Viewport.getInstance();
    const loc = viewport.worldToCanvasCoords(glassLoc);

    ctx.save();
    ctx.translate(loc.x, loc.y);
    ctx.scale(1 / 32, 1 / 32);

    const path = new Path2D(
      'M385.758 160c9.063-6.44 17.756-13.608 25.722-21.574 16.701-16.701 27.873-37.25 31.456-57.861 3.929-22.593-1.836-43.57-15.815-57.55-11.15-11.149-26.255-17.043-43.682-17.043-24.816 0-50.961 11.912-71.73 32.681-33.238 33.238-52.613 79.119-63.038 111.861-7.72-32.901-23.103-77.322-53.009-107.229-16.047-16.046-36.557-24.285-55.923-24.285-15.827 0-30.89 5.502-42.13 16.743-24.993 24.994-21.616 68.893 7.543 98.052 10.396 10.396 22.549 19.031 35.36 26.206h-108.512v128h32v224h384v-224.001h32v-128h-94.242zM337.163 64.109c13.862-13.862 31.161-22.137 46.275-22.137 5.35 0 12.854 1.127 18.225 6.499 13.015 13.014 5.706 43.154-15.64 64.499-21.973 21.973-51.53 37.084-77.216 47.030h-25.336c9.284-28.774 26.029-68.228 53.692-95.891zM130.607 108.338c-7.914-7.914-12.885-18.080-13.64-27.893-0.351-4.56-0.025-13.124 6.098-19.247 5.122-5.122 11.894-6.198 16.674-6.198v0c10.629 0 21.734 5.008 30.466 13.74 16.936 16.936 30.883 43.886 40.334 77.938 0.255 0.92 0.504 1.835 0.748 2.743-0.908-0.243-1.823-0.492-2.743-0.748-34.052-9.451-61.002-23.399-77.937-40.335zM448 272h-160v208h-64v-208h-160v-16h160v-64h64v64h160v16z'
    );
    ctx.translate(-256, -256);

    ctx.fillStyle = 'white';
    ctx.fill(path);

    ctx.restore();
  }

  drawMiner() {
    const { gameUIManager } = this.renderer;
    const { ctx } = this;

    const minerLoc = gameUIManager.getMinerLocation();
    if (minerLoc === null) return;

    const viewport = Viewport.getInstance();
    const loc = viewport.worldToCanvasCoords(minerLoc);

    ctx.save();
    ctx.translate(loc.x, loc.y);
    ctx.scale(1 / 16, 1 / 16);

    const path = new Path2D(
      'M512 224h-50.462c-13.82-89.12-84.418-159.718-173.538-173.538v-50.462h-64v50.462c-89.12 13.82-159.718 84.418-173.538 173.538h-50.462v64h50.462c13.82 89.12 84.418 159.718 173.538 173.538v50.462h64v-50.462c89.12-13.82 159.718-84.418 173.538-173.538h50.462v-64zM396.411 224h-49.881c-9.642-27.275-31.255-48.889-58.53-58.53v-49.881c53.757 12.245 96.166 54.655 108.411 108.411zM256 288c-17.673 0-32-14.327-32-32s14.327-32 32-32c17.673 0 32 14.327 32 32s-14.327 32-32 32zM224 115.589v49.881c-27.275 9.641-48.889 31.255-58.53 58.53h-49.881c12.245-53.756 54.655-96.166 108.411-108.411zM115.589 288h49.881c9.641 27.275 31.255 48.889 58.53 58.53v49.881c-53.756-12.245-96.166-54.654-108.411-108.411zM288 396.411v-49.881c27.275-9.642 48.889-31.255 58.53-58.53h49.881c-12.245 53.757-54.654 96.166-108.411 108.411z'
    );
    ctx.translate(-256, -256);

    ctx.fillStyle = 'white';
    ctx.fill(path);

    ctx.restore();
  }
}