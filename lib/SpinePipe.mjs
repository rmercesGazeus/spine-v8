import { ExtensionType, extensions, collectAllRenderables } from 'pixi.js';
import { BatchableSpineSlot } from './BatchableSpineSlot.mjs';
import { SkeletonClipping, RegionAttachment, MeshAttachment } from '@esotericsoftware/spine-core';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const clipper = new SkeletonClipping();
const spineBlendModeMap = {
  0: "normal",
  1: "add",
  2: "multiply",
  3: "screen"
};
class SpinePipe {
  constructor(renderer) {
    __publicField(this, "renderer");
    __publicField(this, "gpuSpineData", {});
    this.renderer = renderer;
  }
  validateRenderable(spine) {
    spine._applyState();
    if (spine.spineAttachmentsDirty) {
      return true;
    } else if (spine.spineTexturesDirty) {
      const drawOrder = spine.skeleton.drawOrder;
      const gpuSpine = this.gpuSpineData[spine.uid];
      for (let i = 0, n = drawOrder.length; i < n; i++) {
        const slot = drawOrder[i];
        const attachment = slot.getAttachment();
        if (attachment instanceof RegionAttachment || attachment instanceof MeshAttachment) {
          const cacheData = spine._getCachedData(slot, attachment);
          const batchableSpineSlot = gpuSpine.slotBatches?.[cacheData.id];
          const texture = cacheData.texture;
          if (batchableSpineSlot && texture !== batchableSpineSlot?.texture) {
            if (!batchableSpineSlot._batcher.checkAndUpdateTexture(batchableSpineSlot, texture)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
  addRenderable(spine, instructionSet) {
    var _a, _b, _c, _d;
    const gpuSpine = (_a = this.gpuSpineData)[_b = spine.uid] || (_a[_b] = { slotBatches: {} });
    const batcher = this.renderer.renderPipes.batch;
    const drawOrder = spine.skeleton.drawOrder;
    const roundPixels = this.renderer._roundPixels | spine._roundPixels;
    spine._applyState();
    for (let i = 0, n = drawOrder.length; i < n; i++) {
      const slot = drawOrder[i];
      const attachment = slot.getAttachment();
      const blendMode = spineBlendModeMap[slot.data.blendMode];
      if (attachment instanceof RegionAttachment || attachment instanceof MeshAttachment) {
        const cacheData = spine._getCachedData(slot, attachment);
        const batchableSpineSlot = (_c = gpuSpine.slotBatches)[_d = cacheData.id] || (_c[_d] = new BatchableSpineSlot());
        batchableSpineSlot.setData(
          spine,
          cacheData,
          blendMode,
          roundPixels
        );
        if (!cacheData.skipRender) {
          batcher.addToBatch(batchableSpineSlot, instructionSet);
        }
      }
      const containerAttachment = spine._slotsObject[slot.data.name];
      if (containerAttachment) {
        const container = containerAttachment.container;
        container.includeInBuild = true;
        collectAllRenderables(container, instructionSet, this.renderer);
        container.includeInBuild = false;
      }
    }
    clipper.clipEnd();
  }
  updateRenderable(spine) {
    const gpuSpine = this.gpuSpineData[spine.uid];
    spine._applyState();
    const drawOrder = spine.skeleton.drawOrder;
    for (let i = 0, n = drawOrder.length; i < n; i++) {
      const slot = drawOrder[i];
      const attachment = slot.getAttachment();
      if (attachment instanceof RegionAttachment || attachment instanceof MeshAttachment) {
        const cacheData = spine._getCachedData(slot, attachment);
        if (!cacheData.skipRender) {
          const batchableSpineSlot = gpuSpine.slotBatches[spine._getCachedData(slot, attachment).id];
          batchableSpineSlot?._batcher?.updateElement(batchableSpineSlot);
        }
      }
    }
  }
  destroyRenderable(spine) {
    this.gpuSpineData[spine.uid] = null;
  }
  destroy() {
    this.gpuSpineData = null;
    this.renderer = null;
  }
}
/** @ignore */
__publicField(SpinePipe, "extension", {
  type: [
    ExtensionType.WebGLPipes,
    ExtensionType.WebGPUPipes,
    ExtensionType.CanvasPipes
  ],
  name: "spine"
});
extensions.add(SpinePipe);

export { SpinePipe };
//# sourceMappingURL=SpinePipe.mjs.map
