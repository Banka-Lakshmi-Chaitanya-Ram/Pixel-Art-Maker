/**
 * BitStudio — Pixel Art Editor
 * Precision vanilla JavaScript pixel art engine
 */

(function () {
  'use strict';

  // ==========================================================================
  // Color Palette Definitions
  // ==========================================================================
  const PALETTES = {
    sweet16: [
      '#1a1c23', '#493c68', '#a03b5b', '#e26b58',
      '#efab52', '#f9ea85', '#60a34b', '#2e5a44',
      '#1d2d44', '#34558b', '#4fa4b8', '#99e550',
      '#ffffff', '#a8b5c4', '#68778a', '#3f4654'
    ],
    pico8: [
      '#000000', '#1D2B53', '#7E2553', '#008751',
      '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436',
      '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
    ],
    gameboy: [
      '#0f380f', '#306230', '#8bac0f', '#9bbc0f'
    ],
    cyber: [
      '#080014', '#1f0038', '#490068', '#ff007f',
      '#ff00aa', '#00f0ff', '#00ff66', '#ffff00',
      '#7b00ff', '#bd00ff', '#ffffff', '#222831'
    ],
    earth: [
      '#2c1810', '#4a2511', '#8c4826', '#c4784a',
      '#e3a578', '#f5cbb0', '#ffe8d6', '#3b4b28',
      '#5f7243', '#899b6b', '#b3be9f', '#6c584c'
    ],
    monochrome: [
      '#000000', '#1a1a1a', '#333333', '#555555',
      '#777777', '#999999', '#bbbbbb', '#dddddd',
      '#ffffff'
    ]
  };

  // ==========================================================================
  // Single Source of Truth: State Object
  // ==========================================================================
  const state = {
    gridSize: 32,
    cells: [], // 1D array of size gridSize * gridSize, holds hex strings or null
    currentTool: 'pen', // 'pen', 'eraser', 'bucket', 'dropper', 'line', 'rect'
    primaryColor: '#f05d38',
    secondaryColor: '#121316',
    brushSize: 1, // 1, 2, or 3
    mirrorX: false,
    mirrorY: false,
    showGrid: true,
    zoom: 1.0,
    bgColor: 'transparent', // 'transparent', '#ffffff', '#18191e'
    customSwatches: [],
    
    // History
    history: [],
    historyIndex: -1,
    maxHistory: 40,

    // Pointer Interaction
    isDrawing: false,
    lastPoint: null,
    dragStartPoint: null,
    pointerCoords: null
  };

  // Storage Keys
  const STORAGE_PROJECT = 'bitstudio_saved_artwork_v1';
  const STORAGE_SWATCHES = 'bitstudio_saved_swatches_v1';

  // ==========================================================================
  // DOM Elements Cache
  // ==========================================================================
  const DOM = {
    artCanvas: document.getElementById('artCanvas'),
    overlayCanvas: document.getElementById('overlayCanvas'),
    canvasStage: document.getElementById('canvasStage'),
    canvasTransformWrapper: document.getElementById('canvasTransformWrapper'),
    canvasCheckerboard: document.getElementById('canvasCheckerboard'),
    canvasViewport: document.getElementById('canvasViewport'),
    
    // Header controls
    headerGridBadge: document.getElementById('headerGridBadge'),
    btnUndo: document.getElementById('btnUndo'),
    btnRedo: document.getElementById('btnRedo'),
    btnToggleGrid: document.getElementById('btnToggleGrid'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    btnZoomReset: document.getElementById('btnZoomReset'),
    zoomPercentage: document.getElementById('zoomPercentage'),
    btnClearCanvas: document.getElementById('btnClearCanvas'),
    btnShortcuts: document.getElementById('btnShortcuts'),
    imageInput: document.getElementById('imageInput'),
    btnExport: document.getElementById('btnExport'),

    // Tablet & Mobile Header Toggles
    btnTogglePalette: document.getElementById('btnTogglePalette'),
    btnToggleSettings: document.getElementById('btnToggleSettings'),
    headerColorIndicator: document.getElementById('headerColorIndicator'),

    // Drawer elements (Tablet / Mobile)
    sidebarPalette: document.getElementById('sidebarPalette'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    btnDrawerClose: document.getElementById('btnDrawerClose'),
    tabPalette: document.getElementById('tabPalette'),
    tabSettings: document.getElementById('tabSettings'),
    drawerSectionPalette: document.getElementById('drawerSectionPalette'),
    drawerSectionSettings: document.getElementById('drawerSectionSettings'),

    // Mobile Bottom Toolbar
    mobileBottomBar: document.getElementById('mobileBottomBar'),
    mobileToolButtons: document.querySelectorAll('.mobile-tool-btn[data-tool]'),
    mBtnColor: document.getElementById('mBtnColor'),
    mColorCircle: document.getElementById('mColorCircle'),
    mBtnSettings: document.getElementById('mBtnSettings'),

    // Drawer Settings Touch Controls
    sheetBrushGroup: document.getElementById('sheetBrushGroup'),
    sheetBrushSizeButtons: document.querySelectorAll('.size-sheet-btn'),
    btnSheetMirrorX: document.getElementById('btnSheetMirrorX'),
    btnSheetMirrorY: document.getElementById('btnSheetMirrorY'),
    btnSheetToggleGrid: document.getElementById('btnSheetToggleGrid'),
    btnSheetZoomOut: document.getElementById('btnSheetZoomOut'),
    btnSheetZoomIn: document.getElementById('btnSheetZoomIn'),
    btnSheetZoomReset: document.getElementById('btnSheetZoomReset'),
    btnSheetClearCanvas: document.getElementById('btnSheetClearCanvas'),
    sheetImageInput: document.getElementById('sheetImageInput'),
    btnSheetShortcuts: document.getElementById('btnSheetShortcuts'),

    // Tools
    toolButtons: document.querySelectorAll('.tool-btn'),
    brushSizeSection: document.querySelectorAll('.tool-section')[1],
    brushSizeButtons: document.querySelectorAll('.size-btn'),
    btnMirrorX: document.getElementById('btnMirrorX'),
    btnMirrorY: document.getElementById('btnMirrorY'),

    // Palette & Inspector
    primaryColorPreview: document.getElementById('primaryColorPreview'),
    secondaryColorPreview: document.getElementById('secondaryColorPreview'),
    nativeColorPicker: document.getElementById('nativeColorPicker'),
    btnSwapColors: document.getElementById('btnSwapColors'),
    hexInput: document.getElementById('hexInput'),
    btnAddSwatch: document.getElementById('btnAddSwatch'),
    paletteSelect: document.getElementById('paletteSelect'),
    swatchGrid: document.getElementById('swatchGrid'),
    customSwatchGrid: document.getElementById('customSwatchGrid'),
    btnClearCustomSwatches: document.getElementById('btnClearCustomSwatches'),

    // Settings
    gridSizeButtons: document.querySelectorAll('.btn-grid-size:not(.size-sheet-btn)'),
    bgStyleButtons: document.querySelectorAll('.btn-bg-style'),

    // Status bar
    statusCoords: document.getElementById('statusCoords'),
    statusCanvasSize: document.getElementById('statusCanvasSize'),
    statusToolName: document.getElementById('statusToolName'),
    statusSavedIndicator: document.getElementById('statusSavedIndicator'),

    // Modals
    exportModal: document.getElementById('exportModal'),
    btnExportClose: document.getElementById('btnExportClose'),
    btnExportCancel: document.getElementById('btnExportCancel'),
    btnExportConfirm: document.getElementById('btnExportConfirm'),
    exportPreviewImg: document.getElementById('exportPreviewImg'),
    exportScaleSelect: document.getElementById('exportScaleSelect'),
    exportFilenameInput: document.getElementById('exportFilenameInput'),
    exportTransparentCheck: document.getElementById('exportTransparentCheck'),
    exportMetaDimensions: document.getElementById('exportMetaDimensions'),

    confirmModal: document.getElementById('confirmModal'),
    confirmModalTitle: document.getElementById('confirmModalTitle'),
    confirmModalDescription: document.getElementById('confirmModalDescription'),
    btnConfirmCancel: document.getElementById('btnConfirmCancel'),
    btnConfirmProceed: document.getElementById('btnConfirmProceed'),

    shortcutsModal: document.getElementById('shortcutsModal'),
    btnShortcutsClose: document.getElementById('btnShortcutsClose'),
    btnShortcutsOk: document.getElementById('btnShortcutsOk'),

    toastContainer: document.getElementById('toastContainer')
  };

  const artCtx = DOM.artCanvas.getContext('2d', { willReadFrequently: true });
  const overlayCtx = DOM.overlayCanvas.getContext('2d');

  // Pending Confirmation Action Callback
  let pendingConfirmAction = null;

  // ==========================================================================
  // Initialization
  // ==========================================================================
  function init() {
    loadSavedSwatches();
    buildSwatches();
    buildCustomSwatches();

    // Check for existing saved artwork
    const restored = loadArtworkFromStorage();
    if (!restored) {
      initBlankGrid(state.gridSize);
      pushHistory();
    }

    updateBackgroundDisplay();
    updateUI();
    renderAll();
    setupEventListeners();
  }

  // ==========================================================================
  // Grid Data & Canvas Sizing
  // ==========================================================================
  function initBlankGrid(size) {
    state.gridSize = size;
    state.cells = new Array(size * size).fill(null);
    resizeCanvases();
  }

  function getOverlayResolution(gridSize) {
    // Return a sharp resolution that divides evenly by gridSize
    if (gridSize === 16) return 512; // 32px per cell
    if (gridSize === 24) return 576; // 24px per cell
    if (gridSize === 32) return 512; // 16px per cell
    if (gridSize === 48) return 576; // 12px per cell
    if (gridSize === 64) return 512; // 8px per cell
    return gridSize * 16;
  }

  function resizeCanvases() {
    DOM.artCanvas.width = state.gridSize;
    DOM.artCanvas.height = state.gridSize;

    // Overlay display resolution matches display box with crisp integer cells
    const displaySize = getOverlayResolution(state.gridSize);
    DOM.overlayCanvas.width = displaySize;
    DOM.overlayCanvas.height = displaySize;

    updateBackgroundDisplay();
  }

  /**
   * Updates the background display in the editor.
   * Separates the editor preview from actual artwork data.
   */
  function updateBackgroundDisplay() {
    if (state.bgColor === 'transparent') {
      DOM.canvasCheckerboard.style.display = 'block';
      DOM.canvasStage.style.backgroundColor = 'transparent';
    } else {
      DOM.canvasCheckerboard.style.display = 'none';
      DOM.canvasStage.style.backgroundColor = state.bgColor;
    }
  }

  function getIndex(x, y) {
    if (x < 0 || x >= state.gridSize || y < 0 || y >= state.gridSize) return -1;
    return y * state.gridSize + x;
  }

  function getPixel(x, y) {
    const idx = getIndex(x, y);
    if (idx === -1) return null;
    return state.cells[idx];
  }

  function setPixel(x, y, color) {
    const idx = getIndex(x, y);
    if (idx === -1) return;
    state.cells[idx] = color;
  }

  // ==========================================================================
  // Rendering Engine
  // ==========================================================================
  /**
   * Renders ONLY the user's artwork pixels onto artCanvas.
   * Transparent cells are cleared to transparent alpha (never filled with background).
   */
  function renderArtCanvas() {
    artCtx.clearRect(0, 0, state.gridSize, state.gridSize);

    for (let y = 0; y < state.gridSize; y++) {
      for (let x = 0; x < state.gridSize; x++) {
        const color = state.cells[y * state.gridSize + x];
        if (color !== null && color !== undefined) {
          artCtx.fillStyle = color;
          artCtx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  /**
   * Renders grid lines, symmetry markers, hover previews, and shape previews
   * on the overlayCanvas layer.
   */
  function renderOverlayCanvas() {
    const w = DOM.overlayCanvas.width;
    const h = DOM.overlayCanvas.height;
    overlayCtx.clearRect(0, 0, w, h);

    const cellSize = w / state.gridSize;

    // 1. Draw Grid Lines
    if (state.showGrid && cellSize >= 4) {
      overlayCtx.save();
      overlayCtx.lineWidth = 1;
      overlayCtx.strokeStyle = 'rgba(255, 255, 255, 0.09)';

      overlayCtx.beginPath();
      for (let i = 0; i <= state.gridSize; i++) {
        const pos = Math.round(i * cellSize) - 0.5;
        // Vertical line
        overlayCtx.moveTo(pos, 0);
        overlayCtx.lineTo(pos, h);
        // Horizontal line
        overlayCtx.moveTo(0, pos);
        overlayCtx.lineTo(w, pos);
      }
      overlayCtx.stroke();
      overlayCtx.restore();
    }

    // 2. Symmetry Guide Lines
    if (state.mirrorX || state.mirrorY) {
      overlayCtx.save();
      overlayCtx.lineWidth = 1.5;
      overlayCtx.setLineDash([4, 4]);
      overlayCtx.strokeStyle = 'rgba(240, 93, 56, 0.75)';

      overlayCtx.beginPath();
      if (state.mirrorX) {
        const midX = Math.round(w / 2) - 0.5;
        overlayCtx.moveTo(midX, 0);
        overlayCtx.lineTo(midX, h);
      }
      if (state.mirrorY) {
        const midY = Math.round(h / 2) - 0.5;
        overlayCtx.moveTo(0, midY);
        overlayCtx.lineTo(w, midY);
      }
      overlayCtx.stroke();
      overlayCtx.restore();
    }

    // 3. Shape Drag Preview (Line or Rectangle)
    if (state.isDrawing && state.dragStartPoint && state.pointerCoords) {
      if (state.currentTool === 'line') {
        renderLinePreview(state.dragStartPoint, state.pointerCoords, cellSize);
      } else if (state.currentTool === 'rect') {
        renderRectPreview(state.dragStartPoint, state.pointerCoords, cellSize);
      }
    }

    // 4. Cursor Hover Indicator
    if (state.pointerCoords && !state.isDrawing) {
      renderCursorHover(state.pointerCoords.x, state.pointerCoords.y, cellSize);
    }
  }

  function renderCursorHover(x, y, cellSize) {
    if (x < 0 || x >= state.gridSize || y < 0 || y >= state.gridSize) return;

    overlayCtx.save();

    // Determine target cells using exact brush footprint and symmetry
    const effectiveBrushSize = (state.currentTool === 'pen' || state.currentTool === 'eraser')
      ? state.brushSize
      : 1;

    const baseFootprint = getBrushFootprint(x, y, effectiveBrushSize);
    const symCells = getSymmetricalPixels(baseFootprint);

    for (const pt of symCells) {
      const px = pt.x * cellSize;
      const py = pt.y * cellSize;

      if (state.currentTool === 'eraser') {
        overlayCtx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        overlayCtx.strokeStyle = '#ef4444';
      } else if (state.currentTool === 'dropper') {
        overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        overlayCtx.strokeStyle = '#ffffff';
      } else {
        overlayCtx.fillStyle = hexToRgba(state.primaryColor, 0.4);
        overlayCtx.strokeStyle = '#ffffff';
      }

      overlayCtx.lineWidth = 1.5;
      overlayCtx.fillRect(px, py, cellSize, cellSize);
      overlayCtx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
    }

    overlayCtx.restore();
  }

  function renderLinePreview(p0, p1, cellSize) {
    overlayCtx.save();
    overlayCtx.fillStyle = hexToRgba(state.primaryColor, 0.7);

    bresenhamLine(p0.x, p0.y, p1.x, p1.y, (lx, ly) => {
      const footprint = getBrushFootprint(lx, ly, state.brushSize);
      const pts = getSymmetricalPixels(footprint);
      for (const pt of pts) {
        overlayCtx.fillRect(pt.x * cellSize, pt.y * cellSize, cellSize, cellSize);
      }
    });

    overlayCtx.restore();
  }

  function renderRectPreview(p0, p1, cellSize) {
    overlayCtx.save();
    overlayCtx.fillStyle = hexToRgba(state.primaryColor, 0.7);

    const minX = Math.min(p0.x, p1.x);
    const maxX = Math.max(p0.x, p1.x);
    const minY = Math.min(p0.y, p1.y);
    const maxY = Math.max(p0.y, p1.y);

    const edgePoints = [];
    for (let x = minX; x <= maxX; x++) {
      edgePoints.push({ x, y: minY }, { x, y: maxY });
    }
    for (let y = minY; y <= maxY; y++) {
      edgePoints.push({ x: minX, y }, { x: maxX, y });
    }

    for (const ep of edgePoints) {
      const footprint = getBrushFootprint(ep.x, ep.y, state.brushSize);
      const pts = getSymmetricalPixels(footprint);
      for (const pt of pts) {
        overlayCtx.fillRect(pt.x * cellSize, pt.y * cellSize, cellSize, cellSize);
      }
    }

    overlayCtx.restore();
  }

  function renderAll() {
    renderArtCanvas();
    renderOverlayCanvas();
  }

  // ==========================================================================
  // Brush Footprints & Bilateral Symmetry Math
  // ==========================================================================
  /**
   * Generates a consistent pixel footprint for brush sizes 1, 2, and 3.
   * - Size 1: 1 cell
   * - Size 2: 2x2 cells
   * - Size 3: 3x3 cells (centered)
   */
  function getBrushFootprint(cx, cy, size) {
    if (size === 1) {
      return [{ x: cx, y: cy }];
    } else if (size === 2) {
      return [
        { x: cx, y: cy },
        { x: cx + 1, y: cy },
        { x: cx, y: cy + 1 },
        { x: cx + 1, y: cy + 1 }
      ];
    } else if (size === 3) {
      const pts = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          pts.push({ x: cx + dx, y: cy + dy });
        }
      }
      return pts;
    }
    return [{ x: cx, y: cy }];
  }

  /**
   * Computes symmetrical mirrored pixels for any footprint across X and Y axes.
   * Handles odd and even grid sizes and deduplicates cleanly.
   */
  function getSymmetricalPixels(footprint) {
    const maxX = state.gridSize - 1;
    const maxY = state.gridSize - 1;
    const seen = new Set();
    const result = [];

    for (const pt of footprint) {
      const targets = [{ x: pt.x, y: pt.y }];

      if (state.mirrorX) {
        targets.push({ x: maxX - pt.x, y: pt.y });
      }
      if (state.mirrorY) {
        targets.push({ x: pt.x, y: maxY - pt.y });
      }
      if (state.mirrorX && state.mirrorY) {
        targets.push({ x: maxX - pt.x, y: maxY - pt.y });
      }

      for (const t of targets) {
        if (t.x >= 0 && t.x <= maxX && t.y >= 0 && t.y <= maxY) {
          const key = `${t.x},${t.y}`;
          if (!seen.has(key)) {
            seen.add(key);
            result.push(t);
          }
        }
      }
    }
    return result;
  }

  /**
   * Applies the selected brush size and symmetry to the canvas.
   */
  function applyBrushAt(centerX, centerY, color) {
    const footprint = getBrushFootprint(centerX, centerY, state.brushSize);
    const symCells = getSymmetricalPixels(footprint);

    for (const pt of symCells) {
      setPixel(pt.x, pt.y, color);
    }
  }

  // Bresenham's line algorithm for continuous, gap-free drawing
  function bresenhamLine(x0, y0, x1, y1, callback) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
      callback(x, y);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  // ==========================================================================
  // Flood Fill Algorithm (Iterative BFS - Safe for 64×64 Grids)
  // ==========================================================================
  function floodFill(startX, startY, fillColor) {
    const targetColor = getPixel(startX, startY);
    if (targetColor === fillColor) return;

    // Get symmetrical starting coordinates
    const startPoints = getSymmetricalPixels([{ x: startX, y: startY }]);

    for (const startPt of startPoints) {
      const originColor = getPixel(startPt.x, startPt.y);
      if (originColor === fillColor) continue;

      const stack = [[startPt.x, startPt.y]];
      const visited = new Uint8Array(state.gridSize * state.gridSize);

      while (stack.length > 0) {
        const [x, y] = stack.pop();
        const idx = y * state.gridSize + x;
        if (visited[idx]) continue;
        visited[idx] = 1;

        if (getPixel(x, y) === originColor) {
          setPixel(x, y, fillColor);

          if (x > 0 && !visited[y * state.gridSize + (x - 1)]) stack.push([x - 1, y]);
          if (x < state.gridSize - 1 && !visited[y * state.gridSize + (x + 1)]) stack.push([x + 1, y]);
          if (y > 0 && !visited[(y - 1) * state.gridSize + x]) stack.push([x, y - 1]);
          if (y < state.gridSize - 1 && !visited[(y + 1) * state.gridSize + x]) stack.push([x, y + 1]);
        }
      }
    }
  }

  // ==========================================================================
  // Pointer & Drawing Event Handling
  // ==========================================================================
  function getCanvasCoords(e) {
    const rect = DOM.overlayCanvas.getBoundingClientRect();
    const stageX = e.clientX - rect.left;
    const stageY = e.clientY - rect.top;

    const cellX = Math.floor((stageX / rect.width) * state.gridSize);
    const cellY = Math.floor((stageY / rect.height) * state.gridSize);

    return {
      x: Math.max(0, Math.min(state.gridSize - 1, cellX)),
      y: Math.max(0, Math.min(state.gridSize - 1, cellY))
    };
  }

  function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // Left click only

    try {
      DOM.overlayCanvas.setPointerCapture(e.pointerId);
    } catch (_) {}

    state.isDrawing = true;

    const coords = getCanvasCoords(e);
    state.lastPoint = coords;
    state.dragStartPoint = coords;
    state.pointerCoords = coords;

    if (state.currentTool === 'pen') {
      applyBrushAt(coords.x, coords.y, state.primaryColor);
      renderArtCanvas();
    } else if (state.currentTool === 'eraser') {
      applyBrushAt(coords.x, coords.y, null);
      renderArtCanvas();
    } else if (state.currentTool === 'bucket') {
      floodFill(coords.x, coords.y, state.primaryColor);
      renderArtCanvas();
      pushHistory();
      saveArtworkToStorage();
    } else if (state.currentTool === 'dropper') {
      pickColorFromCell(coords.x, coords.y);
    }

    renderOverlayCanvas();
  }

  function onPointerMove(e) {
    const coords = getCanvasCoords(e);
    state.pointerCoords = coords;
    updateStatusCoords(coords.x, coords.y);

    if (state.isDrawing) {
      if (state.currentTool === 'pen') {
        bresenhamLine(state.lastPoint.x, state.lastPoint.y, coords.x, coords.y, (x, y) => {
          applyBrushAt(x, y, state.primaryColor);
        });
        state.lastPoint = coords;
        renderArtCanvas();
      } else if (state.currentTool === 'eraser') {
        bresenhamLine(state.lastPoint.x, state.lastPoint.y, coords.x, coords.y, (x, y) => {
          applyBrushAt(x, y, null);
        });
        state.lastPoint = coords;
        renderArtCanvas();
      }
    }

    renderOverlayCanvas();
  }

  function onPointerUp(e) {
    if (!state.isDrawing) return;

    if (e && e.pointerId) {
      try {
        DOM.overlayCanvas.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    const coords = state.pointerCoords || (e ? getCanvasCoords(e) : state.lastPoint);

    // Commit Line Tool
    if (state.currentTool === 'line' && state.dragStartPoint && coords) {
      bresenhamLine(state.dragStartPoint.x, state.dragStartPoint.y, coords.x, coords.y, (x, y) => {
        applyBrushAt(x, y, state.primaryColor);
      });
      renderArtCanvas();
    }

    // Commit Rectangle Tool
    if (state.currentTool === 'rect' && state.dragStartPoint && coords) {
      const minX = Math.min(state.dragStartPoint.x, coords.x);
      const maxX = Math.max(state.dragStartPoint.x, coords.x);
      const minY = Math.min(state.dragStartPoint.y, coords.y);
      const maxY = Math.max(state.dragStartPoint.y, coords.y);

      for (let x = minX; x <= maxX; x++) {
        applyBrushAt(x, minY, state.primaryColor);
        applyBrushAt(x, maxY, state.primaryColor);
      }
      for (let y = minY; y <= maxY; y++) {
        applyBrushAt(minX, y, state.primaryColor);
        applyBrushAt(maxX, y, state.primaryColor);
      }
      renderArtCanvas();
    }

    state.isDrawing = false;
    state.dragStartPoint = null;
    state.lastPoint = null;

    // For touch devices, clear hover indicator on lift so cursor box does not stick
    if (e && e.pointerType === 'touch') {
      state.pointerCoords = null;
      updateStatusCoords(null, null);
    }

    pushHistory();
    saveArtworkToStorage();
    renderOverlayCanvas();
  }

  function onPointerCancel(e) {
    if (e && e.pointerId) {
      try {
        DOM.overlayCanvas.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
    state.isDrawing = false;
    state.dragStartPoint = null;
    state.lastPoint = null;
    state.pointerCoords = null;
    updateStatusCoords(null, null);
    renderOverlayCanvas();
  }

  function onPointerLeave() {
    if (state.isDrawing) return; // Don't interrupt active drag previews
    state.pointerCoords = null;
    updateStatusCoords(null, null);
    renderOverlayCanvas();
  }

  function pickColorFromCell(x, y) {
    const color = getPixel(x, y);
    if (color) {
      setPrimaryColor(color);
      showToast(`Sampled color: ${color.toUpperCase()}`);
    } else if (state.bgColor !== 'transparent') {
      setPrimaryColor(state.bgColor);
      showToast(`Sampled background: ${state.bgColor.toUpperCase()}`);
    } else {
      showToast('Cell is transparent');
    }

    // Return to Pen tool after picking
    selectTool('pen');
  }

  // ==========================================================================
  // Drawer / Mobile Sheet Controller (Tablet & Mobile)
  // ==========================================================================
  function openDrawer(tab) {
    if (DOM.sidebarPalette) {
      DOM.sidebarPalette.classList.add('drawer-open');
    }
    if (DOM.drawerBackdrop) {
      DOM.drawerBackdrop.classList.add('active');
    }
    if (tab) {
      switchDrawerTab(tab);
    }
  }

  function closeDrawer() {
    if (DOM.sidebarPalette) {
      DOM.sidebarPalette.classList.remove('drawer-open');
    }
    if (DOM.drawerBackdrop) {
      DOM.drawerBackdrop.classList.remove('active');
    }
  }

  function switchDrawerTab(tab) {
    const isPalette = tab === 'palette';
    if (DOM.tabPalette) {
      DOM.tabPalette.classList.toggle('active', isPalette);
      DOM.tabPalette.setAttribute('aria-selected', isPalette ? 'true' : 'false');
    }
    if (DOM.tabSettings) {
      DOM.tabSettings.classList.toggle('active', !isPalette);
      DOM.tabSettings.setAttribute('aria-selected', !isPalette ? 'true' : 'false');
    }
    if (DOM.drawerSectionPalette) {
      DOM.drawerSectionPalette.classList.toggle('active', isPalette);
    }
    if (DOM.drawerSectionSettings) {
      DOM.drawerSectionSettings.classList.toggle('active', !isPalette);
    }
  }

  // ==========================================================================
  // Tool Selection & Mode Updates
  // ==========================================================================
  function selectTool(toolName) {
    state.currentTool = toolName;

    // Update cursor style on overlay canvas
    const cursors = {
      pen: 'crosshair',
      eraser: 'cell',
      bucket: 'copy',
      dropper: 'crosshair',
      line: 'crosshair',
      rect: 'crosshair'
    };
    DOM.overlayCanvas.style.cursor = cursors[toolName] || 'crosshair';

    updateUI();
    renderOverlayCanvas();
    showToast(`Tool: ${formatToolTitle(toolName)}`);
  }

  function setBrushSize(size) {
    state.brushSize = size;
    updateUI();
    renderOverlayCanvas();
    showToast(`Stroke Size: ${size}px`);
  }

  function formatToolTitle(tool) {
    const map = {
      pen: 'Pencil / Pen',
      eraser: 'Eraser',
      bucket: 'Paint Bucket',
      dropper: 'Eyedropper',
      line: 'Line',
      rect: 'Rectangle'
    };
    return map[tool] || tool;
  }

  // ==========================================================================
  // History Management (Undo / Redo)
  // ==========================================================================
  function pushHistory() {
    // If not at head, truncate future redo branch
    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }

    // Add state snapshot
    state.history.push({
      gridSize: state.gridSize,
      cells: [...state.cells],
      bgColor: state.bgColor
    });

    if (state.history.length > state.maxHistory) {
      state.history.shift();
    } else {
      state.historyIndex++;
    }

    updateHistoryButtons();
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      restoreState(state.history[state.historyIndex]);
      updateHistoryButtons();
      saveArtworkToStorage();
      showToast('Undo');
    }
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      restoreState(state.history[state.historyIndex]);
      updateHistoryButtons();
      saveArtworkToStorage();
      showToast('Redo');
    }
  }

  function restoreState(snapshot) {
    state.gridSize = snapshot.gridSize;
    state.cells = [...snapshot.cells];
    state.bgColor = snapshot.bgColor;

    resizeCanvases();
    updateBackgroundDisplay();
    updateUI();
    renderAll();
  }

  function updateHistoryButtons() {
    DOM.btnUndo.disabled = state.historyIndex <= 0;
    DOM.btnRedo.disabled = state.historyIndex >= state.history.length - 1;
  }

  // ==========================================================================
  // Persistence (LocalStorage)
  // ==========================================================================
  function saveArtworkToStorage() {
    try {
      const data = {
        gridSize: state.gridSize,
        cells: state.cells,
        bgColor: state.bgColor,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_PROJECT, JSON.stringify(data));
      flashSavedIndicator();
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
  }

  function loadArtworkFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_PROJECT);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data && data.gridSize && Array.isArray(data.cells)) {
        if (data.cells.length === data.gridSize * data.gridSize) {
          state.gridSize = data.gridSize;
          state.cells = data.cells;
          state.bgColor = data.bgColor || 'transparent';
          resizeCanvases();
          pushHistory();
          return true;
        }
      }
    } catch (err) {
      console.warn('Failed restoring artwork from localStorage:', err);
    }
    return false;
  }

  function flashSavedIndicator() {
    DOM.statusSavedIndicator.textContent = 'Saved';
    DOM.statusSavedIndicator.style.opacity = '1';
    setTimeout(() => {
      DOM.statusSavedIndicator.textContent = 'Auto-saved';
    }, 1500);
  }

  function loadSavedSwatches() {
    try {
      const raw = localStorage.getItem(STORAGE_SWATCHES);
      if (raw) {
        state.customSwatches = JSON.parse(raw);
      }
    } catch (_) {
      state.customSwatches = [];
    }
  }

  function saveCustomSwatches() {
    try {
      localStorage.setItem(STORAGE_SWATCHES, JSON.stringify(state.customSwatches));
    } catch (_) {}
  }

  // ==========================================================================
  // Color & Palette Management
  // ==========================================================================
  function setPrimaryColor(hex) {
    state.primaryColor = normalizeHex(hex);
    DOM.primaryColorPreview.style.backgroundColor = state.primaryColor;
    DOM.nativeColorPicker.value = state.primaryColor;
    DOM.hexInput.value = state.primaryColor.replace('#', '').toUpperCase();
    if (DOM.headerColorIndicator) {
      DOM.headerColorIndicator.style.backgroundColor = state.primaryColor;
    }
    if (DOM.mColorCircle) {
      DOM.mColorCircle.style.backgroundColor = state.primaryColor;
    }
    highlightActiveSwatch();
    renderOverlayCanvas();
  }

  function setSecondaryColor(hex) {
    state.secondaryColor = normalizeHex(hex);
    DOM.secondaryColorPreview.style.backgroundColor = state.secondaryColor;
  }

  function swapColors() {
    const temp = state.primaryColor;
    setPrimaryColor(state.secondaryColor);
    setSecondaryColor(temp);
    showToast('Colors swapped');
  }

  function normalizeHex(hex) {
    if (!hex) return '#000000';
    let clean = hex.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (clean.length === 4) {
      clean = '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
    }
    return clean.toLowerCase();
  }

  function buildSwatches() {
    DOM.swatchGrid.innerHTML = '';
    const selectedKey = DOM.paletteSelect.value;
    const colors = PALETTES[selectedKey] || PALETTES.sweet16;

    colors.forEach(color => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-btn';
      btn.style.backgroundColor = color;
      btn.title = `Color: ${color.toUpperCase()}`;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-label', `Color ${color}`);

      if (normalizeHex(color) === normalizeHex(state.primaryColor)) {
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
      } else {
        btn.setAttribute('aria-checked', 'false');
      }

      btn.addEventListener('click', () => {
        setPrimaryColor(color);
      });

      // Right click sets secondary color
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        setSecondaryColor(color);
        showToast(`Secondary color set: ${color.toUpperCase()}`);
      });

      DOM.swatchGrid.appendChild(btn);
    });
  }

  function buildCustomSwatches() {
    DOM.customSwatchGrid.innerHTML = '';
    if (state.customSwatches.length === 0) {
      DOM.customSwatchGrid.innerHTML = '<span style="font-size: 11px; color: var(--text-muted); grid-column: 1 / -1; padding: 4px 0;">No custom swatches yet.</span>';
      return;
    }

    state.customSwatches.forEach((color, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-btn';
      btn.style.backgroundColor = color;
      btn.title = `Custom: ${color.toUpperCase()} (Right click to remove)`;

      if (normalizeHex(color) === normalizeHex(state.primaryColor)) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        setPrimaryColor(color);
      });

      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        state.customSwatches.splice(idx, 1);
        saveCustomSwatches();
        buildCustomSwatches();
        showToast('Swatch removed');
      });

      DOM.customSwatchGrid.appendChild(btn);
    });
  }

  function addCurrentColorToCustomSwatches() {
    const col = state.primaryColor;
    if (!state.customSwatches.includes(col)) {
      state.customSwatches.push(col);
      saveCustomSwatches();
      buildCustomSwatches();
      showToast('Added to custom swatches');
    } else {
      showToast('Color already in custom swatches');
    }
  }

  function highlightActiveSwatch() {
    const swatches = document.querySelectorAll('.swatch-btn');
    swatches.forEach(s => {
      const bg = rgbToHex(s.style.backgroundColor);
      if (bg && normalizeHex(bg) === normalizeHex(state.primaryColor)) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  }

  // ==========================================================================
  // Grid Size Resizing
  // ==========================================================================
  /**
   * Checks whether downsizing to newSize will crop any non-null drawn pixels.
   */
  function willCropArtwork(newSize) {
    if (newSize >= state.gridSize) return false;
    for (let y = 0; y < state.gridSize; y++) {
      for (let x = 0; x < state.gridSize; x++) {
        if (x >= newSize || y >= newSize) {
          if (state.cells[y * state.gridSize + x] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function setGridDimensions(newSize) {
    if (newSize === state.gridSize) return;

    const willCrop = willCropArtwork(newSize);

    if (willCrop) {
      showConfirmDialog(
        `Resize to ${newSize}×${newSize}?`,
        `Downsizing will crop existing artwork outside the ${newSize}×${newSize} boundary. Do you want to proceed? (You can undo this with Ctrl+Z)`,
        () => performResize(newSize)
      );
    } else {
      performResize(newSize);
    }
  }

  function performResize(newSize) {
    const oldSize = state.gridSize;
    const oldCells = [...state.cells];
    const newCells = new Array(newSize * newSize).fill(null);

    // Copy overlapping pixels cleanly from top-left
    const copyLimit = Math.min(oldSize, newSize);
    for (let y = 0; y < copyLimit; y++) {
      for (let x = 0; x < copyLimit; x++) {
        newCells[y * newSize + x] = oldCells[y * oldSize + x];
      }
    }

    state.gridSize = newSize;
    state.cells = newCells;

    resizeCanvases();
    pushHistory();
    saveArtworkToStorage();
    updateUI();
    renderAll();
    showToast(`Canvas resized to ${newSize}×${newSize}`);
  }

  // ==========================================================================
  // Canvas Background Selection
  // ==========================================================================
  function setCanvasBackground(newBg) {
    if (state.bgColor === newBg) return;

    state.bgColor = newBg;
    updateBackgroundDisplay();
    updateUI();
    pushHistory();
    saveArtworkToStorage();

    const labelMap = {
      transparent: 'Alpha (Transparent)',
      '#ffffff': 'White',
      '#18191e': 'Dark'
    };
    showToast(`Canvas background: ${labelMap[newBg] || newBg}`);
  }

  // ==========================================================================
  // Clear Canvas
  // ==========================================================================
  function confirmClearCanvas() {
    const hasArtwork = state.cells.some(c => c !== null);
    if (!hasArtwork) {
      showToast('Canvas is already empty');
      return;
    }

    showConfirmDialog(
      'Clear Artwork?',
      'This will reset all pixels on the canvas. You can undo this action immediately after with Ctrl+Z.',
      () => {
        state.cells.fill(null);
        pushHistory();
        saveArtworkToStorage();
        renderAll();
        showToast('Canvas cleared');
      }
    );
  }

  // ==========================================================================
  // Zoom Controls
  // ==========================================================================
  function setZoom(factor) {
    state.zoom = Math.max(0.5, Math.min(3.0, factor));
    DOM.canvasTransformWrapper.style.transform = `scale(${state.zoom})`;
    DOM.zoomPercentage.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function zoomIn() {
    setZoom(state.zoom + 0.25);
  }

  function zoomOut() {
    setZoom(state.zoom - 0.25);
  }

  function zoomReset() {
    setZoom(1.0);
  }

  // ==========================================================================
  // PNG Export
  // ==========================================================================
  function openExportModal() {
    // Sync transparency checkbox default with active background
    if (state.bgColor === 'transparent') {
      DOM.exportTransparentCheck.checked = true;
    } else {
      DOM.exportTransparentCheck.checked = false;
    }

    updateExportPreview();
    DOM.exportModal.hidden = false;
  }

  function closeExportModal() {
    DOM.exportModal.hidden = true;
  }

  function updateExportPreview() {
    const scale = parseInt(DOM.exportScaleSelect.value, 10) || 16;
    const preserveAlpha = DOM.exportTransparentCheck.checked;
    const outputDim = state.gridSize * scale;

    DOM.exportMetaDimensions.textContent = `Output: ${outputDim} × ${outputDim} px (${scale}× scale)`;

    // Render scaled preview on clean offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = outputDim;
    offscreen.height = outputDim;
    const ctx = offscreen.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    if (!preserveAlpha) {
      ctx.fillStyle = state.bgColor !== 'transparent' ? state.bgColor : '#ffffff';
      ctx.fillRect(0, 0, outputDim, outputDim);
    }

    // Draw raw artwork without grid lines
    ctx.drawImage(DOM.artCanvas, 0, 0, outputDim, outputDim);
    DOM.exportPreviewImg.src = offscreen.toDataURL('image/png');
  }

  function downloadPNG() {
    const scale = parseInt(DOM.exportScaleSelect.value, 10) || 16;
    const preserveAlpha = DOM.exportTransparentCheck.checked;
    const outputDim = state.gridSize * scale;

    const offscreen = document.createElement('canvas');
    offscreen.width = outputDim;
    offscreen.height = outputDim;
    const ctx = offscreen.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    if (!preserveAlpha) {
      ctx.fillStyle = state.bgColor !== 'transparent' ? state.bgColor : '#ffffff';
      ctx.fillRect(0, 0, outputDim, outputDim);
    }

    ctx.drawImage(DOM.artCanvas, 0, 0, outputDim, outputDim);

    const rawName = DOM.exportFilenameInput.value.trim() || 'pixel-artwork';
    const filename = `${rawName}-${state.gridSize}x${state.gridSize}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = offscreen.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    closeExportModal();
    showToast(`Exported ${filename}`);
  }

  // ==========================================================================
  // Image Import (Convert Uploaded Image to Pixel Art)
  // ==========================================================================
  function handleImageImport(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = state.gridSize;
        offscreen.height = state.gridSize;
        const ctx = offscreen.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Draw image scaled down to active grid
        ctx.drawImage(img, 0, 0, state.gridSize, state.gridSize);
        const imgData = ctx.getImageData(0, 0, state.gridSize, state.gridSize);
        const data = imgData.data;

        for (let y = 0; y < state.gridSize; y++) {
          for (let x = 0; x < state.gridSize; x++) {
            const idx = (y * state.gridSize + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a < 32) {
              state.cells[y * state.gridSize + x] = null;
            } else {
              state.cells[y * state.gridSize + x] = rgbToHexValues(r, g, b);
            }
          }
        }

        pushHistory();
        saveArtworkToStorage();
        renderAll();
        showToast(`Imported image onto ${state.gridSize}×${state.gridSize} grid`);
        DOM.imageInput.value = '';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ==========================================================================
  // Confirmation Modal
  // ==========================================================================
  function showConfirmDialog(title, description, onProceed) {
    DOM.confirmModalTitle.textContent = title;
    DOM.confirmModalDescription.textContent = description;
    pendingConfirmAction = onProceed;
    DOM.confirmModal.hidden = false;
  }

  function closeConfirmDialog() {
    DOM.confirmModal.hidden = true;
    pendingConfirmAction = null;
  }

  // ==========================================================================
  // UI Synchronization & Status Updates
  // ==========================================================================
  function updateUI() {
    DOM.headerGridBadge.textContent = `${state.gridSize}×${state.gridSize}`;
    DOM.statusCanvasSize.textContent = `${state.gridSize} × ${state.gridSize}`;

    // Active tool button (Desktop sidebar)
    DOM.toolButtons.forEach(btn => {
      const isActive = btn.dataset.tool === state.currentTool;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });

    // Active tool button (Mobile bottom toolbar)
    if (DOM.mobileToolButtons) {
      DOM.mobileToolButtons.forEach(btn => {
        const isActive = btn.dataset.tool === state.currentTool;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });
    }

    // Color indicator chips
    if (DOM.headerColorIndicator) {
      DOM.headerColorIndicator.style.backgroundColor = state.primaryColor;
    }
    if (DOM.mColorCircle) {
      DOM.mColorCircle.style.backgroundColor = state.primaryColor;
    }

    // Stroke size support check: Pen, Eraser support stroke size
    const supportsStrokeSize = (state.currentTool === 'pen' || state.currentTool === 'eraser');
    if (DOM.brushSizeSection) {
      DOM.brushSizeSection.classList.toggle('disabled', !supportsStrokeSize);
    }
    if (DOM.sheetBrushGroup) {
      DOM.sheetBrushGroup.classList.toggle('disabled', !supportsStrokeSize);
      DOM.sheetBrushGroup.style.opacity = supportsStrokeSize ? '1' : '0.45';
      DOM.sheetBrushGroup.style.pointerEvents = supportsStrokeSize ? 'auto' : 'none';
    }

    // Active brush size (Desktop sidebar)
    DOM.brushSizeButtons.forEach(btn => {
      const isActive = parseInt(btn.dataset.size, 10) === state.brushSize;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });

    // Active brush size (Drawer settings)
    if (DOM.sheetBrushSizeButtons) {
      DOM.sheetBrushSizeButtons.forEach(btn => {
        const isActive = parseInt(btn.dataset.size, 10) === state.brushSize;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });
    }

    // Symmetry Toggles
    DOM.btnMirrorX.classList.toggle('active', state.mirrorX);
    DOM.btnMirrorX.setAttribute('aria-pressed', state.mirrorX ? 'true' : 'false');
    DOM.btnMirrorY.classList.toggle('active', state.mirrorY);
    DOM.btnMirrorY.setAttribute('aria-pressed', state.mirrorY ? 'true' : 'false');

    if (DOM.btnSheetMirrorX) {
      DOM.btnSheetMirrorX.classList.toggle('active', state.mirrorX);
      DOM.btnSheetMirrorX.setAttribute('aria-pressed', state.mirrorX ? 'true' : 'false');
    }
    if (DOM.btnSheetMirrorY) {
      DOM.btnSheetMirrorY.classList.toggle('active', state.mirrorY);
      DOM.btnSheetMirrorY.setAttribute('aria-pressed', state.mirrorY ? 'true' : 'false');
    }

    // Grid toggle
    DOM.btnToggleGrid.classList.toggle('active', state.showGrid);
    DOM.btnToggleGrid.setAttribute('aria-pressed', state.showGrid ? 'true' : 'false');
    if (DOM.btnSheetToggleGrid) {
      DOM.btnSheetToggleGrid.classList.toggle('active', state.showGrid);
      DOM.btnSheetToggleGrid.setAttribute('aria-pressed', state.showGrid ? 'true' : 'false');
    }

    // Grid size selector buttons
    DOM.gridSizeButtons.forEach(btn => {
      const isActive = parseInt(btn.dataset.size, 10) === state.gridSize;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });

    // Background style buttons
    DOM.bgStyleButtons.forEach(btn => {
      const isActive = btn.dataset.bg === state.bgColor;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });

    // Tool name in status bar
    const toolNames = {
      pen: `Pen (${state.brushSize}px)`,
      eraser: `Eraser (${state.brushSize}px)`,
      bucket: 'Paint Bucket',
      dropper: 'Eyedropper',
      line: 'Line Tool',
      rect: 'Rectangle Tool'
    };
    DOM.statusToolName.textContent = toolNames[state.currentTool] || 'Pen';

    updateHistoryButtons();
  }

  function updateStatusCoords(x, y) {
    if (x === null || y === null) {
      DOM.statusCoords.textContent = '-- , --';
    } else {
      DOM.statusCoords.textContent = `${x} , ${y}`;
    }
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 2200);
  }

  // ==========================================================================
  // Event Listeners Setup
  // ==========================================================================
  function setupEventListeners() {
    // Canvas pointer events
    DOM.overlayCanvas.addEventListener('pointerdown', onPointerDown);
    DOM.overlayCanvas.addEventListener('pointermove', onPointerMove);
    DOM.overlayCanvas.addEventListener('pointerup', onPointerUp);
    DOM.overlayCanvas.addEventListener('pointercancel', onPointerUp);
    DOM.overlayCanvas.addEventListener('pointerleave', onPointerLeave);

    // CRITICAL: Window-level pointerup to prevent drawing state or capture from sticking
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Prevent touch scrolling gestures on overlay canvas
    DOM.overlayCanvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // History buttons
    DOM.btnUndo.addEventListener('click', undo);
    DOM.btnRedo.addEventListener('click', redo);

    // Grid toggle
    DOM.btnToggleGrid.addEventListener('click', () => {
      state.showGrid = !state.showGrid;
      DOM.btnToggleGrid.classList.toggle('active', state.showGrid);
      DOM.btnToggleGrid.setAttribute('aria-pressed', state.showGrid ? 'true' : 'false');
      renderOverlayCanvas();
      showToast(state.showGrid ? 'Grid Lines: ON' : 'Grid Lines: OFF');
    });

    // Zoom buttons
    DOM.btnZoomIn.addEventListener('click', zoomIn);
    DOM.btnZoomOut.addEventListener('click', zoomOut);
    DOM.btnZoomReset.addEventListener('click', zoomReset);

    // Canvas zoom via mouse wheel
    DOM.canvasViewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
      }
    }, { passive: false });

    // Clear Canvas
    DOM.btnClearCanvas.addEventListener('click', confirmClearCanvas);

    // Tools Selection
    DOM.toolButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        const tool = targetBtn.dataset.tool;
        if (tool) {
          selectTool(tool);
        }
      });
    });

    // Stroke Size Selection
    DOM.brushSizeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        const size = parseInt(targetBtn.dataset.size, 10);
        if (size >= 1 && size <= 3) {
          setBrushSize(size);
        }
      });
    });

    // Symmetry Controls (Independently toggleable)
    DOM.btnMirrorX.addEventListener('click', () => {
      state.mirrorX = !state.mirrorX;
      updateUI();
      renderOverlayCanvas();
      showToast(state.mirrorX ? 'Mirror X: Enabled' : 'Mirror X: Disabled');
    });

    DOM.btnMirrorY.addEventListener('click', () => {
      state.mirrorY = !state.mirrorY;
      updateUI();
      renderOverlayCanvas();
      showToast(state.mirrorY ? 'Mirror Y: Enabled' : 'Mirror Y: Disabled');
    });

    // Color Inputs
    DOM.nativeColorPicker.addEventListener('input', (e) => {
      setPrimaryColor(e.target.value);
    });

    DOM.btnSwapColors.addEventListener('click', swapColors);

    DOM.hexInput.addEventListener('change', (e) => {
      const val = normalizeHex(e.target.value);
      setPrimaryColor(val);
    });

    DOM.btnAddSwatch.addEventListener('click', addCurrentColorToCustomSwatches);

    DOM.btnClearCustomSwatches.addEventListener('click', () => {
      state.customSwatches = [];
      saveCustomSwatches();
      buildCustomSwatches();
      showToast('Custom swatches cleared');
    });

    DOM.paletteSelect.addEventListener('change', buildSwatches);

    // Grid Size Selection
    DOM.gridSizeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        const size = parseInt(targetBtn.dataset.size, 10);
        if (size) {
          setGridDimensions(size);
        }
      });
    });

    // Background Style Selection
    DOM.bgStyleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        const bg = targetBtn.dataset.bg;
        if (bg) {
          setCanvasBackground(bg);
        }
      });
    });

    // Export Modal Events
    DOM.btnExport.addEventListener('click', openExportModal);
    DOM.btnExportClose.addEventListener('click', closeExportModal);
    DOM.btnExportCancel.addEventListener('click', closeExportModal);
    DOM.btnExportConfirm.addEventListener('click', downloadPNG);
    DOM.exportScaleSelect.addEventListener('change', updateExportPreview);
    DOM.exportTransparentCheck.addEventListener('change', updateExportPreview);

    // Confirmation Modal Events
    DOM.btnConfirmCancel.addEventListener('click', closeConfirmDialog);
    DOM.btnConfirmProceed.addEventListener('click', () => {
      if (pendingConfirmAction) pendingConfirmAction();
      closeConfirmDialog();
    });

    // Shortcuts Modal Events
    DOM.btnShortcuts.addEventListener('click', () => {
      DOM.shortcutsModal.hidden = false;
    });
    DOM.btnShortcutsClose.addEventListener('click', () => {
      DOM.shortcutsModal.hidden = true;
    });
    DOM.btnShortcutsOk.addEventListener('click', () => {
      DOM.shortcutsModal.hidden = true;
    });

    // Image Input
    DOM.imageInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageImport(e.target.files[0]);
      }
    });

    // Drawer & Sheet Toggles (Tablet & Mobile)
    if (DOM.btnTogglePalette) {
      DOM.btnTogglePalette.addEventListener('click', () => openDrawer('palette'));
    }
    if (DOM.btnToggleSettings) {
      DOM.btnToggleSettings.addEventListener('click', () => openDrawer('settings'));
    }
    if (DOM.btnDrawerClose) {
      DOM.btnDrawerClose.addEventListener('click', closeDrawer);
    }
    if (DOM.drawerBackdrop) {
      DOM.drawerBackdrop.addEventListener('click', closeDrawer);
    }
    if (DOM.tabPalette) {
      DOM.tabPalette.addEventListener('click', () => switchDrawerTab('palette'));
    }
    if (DOM.tabSettings) {
      DOM.tabSettings.addEventListener('click', () => switchDrawerTab('settings'));
    }

    // Mobile Bottom Toolbar Buttons
    if (DOM.mobileToolButtons) {
      DOM.mobileToolButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetBtn = e.currentTarget;
          const tool = targetBtn.dataset.tool;
          if (tool) {
            selectTool(tool);
          }
        });
      });
    }

    if (DOM.mBtnColor) {
      DOM.mBtnColor.addEventListener('click', () => openDrawer('palette'));
    }
    if (DOM.mBtnSettings) {
      DOM.mBtnSettings.addEventListener('click', () => openDrawer('settings'));
    }

    // Drawer Settings Touch Controls
    if (DOM.sheetBrushSizeButtons) {
      DOM.sheetBrushSizeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetBtn = e.currentTarget;
          const size = parseInt(targetBtn.dataset.size, 10);
          if (size >= 1 && size <= 3) {
            setBrushSize(size);
          }
        });
      });
    }

    if (DOM.btnSheetMirrorX) {
      DOM.btnSheetMirrorX.addEventListener('click', () => {
        state.mirrorX = !state.mirrorX;
        updateUI();
        renderOverlayCanvas();
        showToast(state.mirrorX ? 'Mirror X: Enabled' : 'Mirror X: Disabled');
      });
    }

    if (DOM.btnSheetMirrorY) {
      DOM.btnSheetMirrorY.addEventListener('click', () => {
        state.mirrorY = !state.mirrorY;
        updateUI();
        renderOverlayCanvas();
        showToast(state.mirrorY ? 'Mirror Y: Enabled' : 'Mirror Y: Disabled');
      });
    }

    if (DOM.btnSheetToggleGrid) {
      DOM.btnSheetToggleGrid.addEventListener('click', () => {
        state.showGrid = !state.showGrid;
        updateUI();
        renderOverlayCanvas();
        showToast(state.showGrid ? 'Grid Lines: ON' : 'Grid Lines: OFF');
      });
    }

    if (DOM.btnSheetZoomOut) DOM.btnSheetZoomOut.addEventListener('click', zoomOut);
    if (DOM.btnSheetZoomIn) DOM.btnSheetZoomIn.addEventListener('click', zoomIn);
    if (DOM.btnSheetZoomReset) DOM.btnSheetZoomReset.addEventListener('click', zoomReset);

    if (DOM.btnSheetClearCanvas) {
      DOM.btnSheetClearCanvas.addEventListener('click', () => {
        closeDrawer();
        confirmClearCanvas();
      });
    }

    if (DOM.sheetImageInput) {
      DOM.sheetImageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleImageImport(e.target.files[0]);
          closeDrawer();
        }
      });
    }

    if (DOM.btnSheetShortcuts) {
      DOM.btnSheetShortcuts.addEventListener('click', () => {
        closeDrawer();
        DOM.shortcutsModal.hidden = false;
      });
    }

    // Modal Backdrop Click-to-Close
    DOM.exportModal.addEventListener('click', (e) => {
      if (e.target === DOM.exportModal) closeExportModal();
    });
    DOM.confirmModal.addEventListener('click', (e) => {
      if (e.target === DOM.confirmModal) closeConfirmDialog();
    });
    DOM.shortcutsModal.addEventListener('click', (e) => {
      if (e.target === DOM.shortcutsModal) DOM.shortcutsModal.hidden = true;
    });

    // Window Resize & Orientation Change Redraw
    window.addEventListener('resize', () => {
      renderOverlayCanvas();
    });

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', handleKeyDown);
  }

  function handleKeyDown(e) {
    // Ignore tool shortcuts if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }

    // Modal & Drawer close on Escape
    if (e.key === 'Escape') {
      closeExportModal();
      closeConfirmDialog();
      closeDrawer();
      DOM.shortcutsModal.hidden = true;
      return;
    }

    const key = e.key.toLowerCase();
    const isCtrl = e.ctrlKey || e.metaKey;

    // History: Undo / Redo
    if (isCtrl && key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if ((isCtrl && key === 'y') || (isCtrl && e.shiftKey && key === 'z')) {
      e.preventDefault();
      redo();
      return;
    }

    // Tools
    if (key === 'b') {
      selectTool('pen');
    } else if (key === 'e') {
      selectTool('eraser');
    } else if (key === 'g') {
      selectTool('bucket');
    } else if (key === 'i') {
      selectTool('dropper');
    } else if (key === 'l') {
      selectTool('line');
    } else if (key === 'r') {
      selectTool('rect');
    } else if (key === 'h') {
      state.showGrid = !state.showGrid;
      updateUI();
      renderOverlayCanvas();
      showToast(state.showGrid ? 'Grid Lines: ON' : 'Grid Lines: OFF');
    } else if (key === 'x') {
      swapColors();
    } else if (key === 'c') {
      confirmClearCanvas();
    } else if (key === '?' || (e.shiftKey && key === '/')) {
      DOM.shortcutsModal.hidden = false;
    } else if (key === '+' || key === '=') {
      zoomIn();
    } else if (key === '-' || key === '_') {
      zoomOut();
    } else if (key === '0') {
      zoomReset();
    } else if (key === '1') {
      setBrushSize(1);
    } else if (key === '2') {
      setBrushSize(2);
    } else if (key === '3') {
      setBrushSize(3);
    }
  }

  // ==========================================================================
  // Color Utility Functions
  // ==========================================================================
  function rgbToHexValues(r, g, b) {
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function rgbToHex(rgbStr) {
    if (!rgbStr) return null;
    if (rgbStr.startsWith('#')) return rgbStr;
    const match = rgbStr.match(/\d+/g);
    if (!match || match.length < 3) return null;
    return rgbToHexValues(parseInt(match[0], 10), parseInt(match[1], 10), parseInt(match[2], 10));
  }

  function hexToRgba(hex, alpha) {
    const clean = normalizeHex(hex).replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Start application on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
