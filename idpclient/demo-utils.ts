/**
 * 获取音频元素
 * @param id 音频元素的ID
 * @returns HTMLAudioElement 音频元素对象
 * @throws 如果元素不存在或不是音频元素则抛出错误
 */
export function getAudio(id: string): HTMLAudioElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLAudioElement)) {
    throw new Error(`Element "${id}" not found or not an audio element.`);
  }
  return el;
}

/**
 * 获取按钮元素
 * @param id 按钮元素的ID
 * @returns HTMLButtonElement 按钮元素对象
 * @throws 如果元素不存在或不是按钮元素则抛出错误
 */
export function getButton(id: string): HTMLButtonElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error(`Element "${id}" not found or not a button element.`);
  }
  return el;
}

/**
 * 获取一组按钮元素
 * @param id 按钮元素的类名
 * @returns Array<HTMLButtonElement> 按钮元素数组
 * @throws 如果元素不存在或不是按钮元素则抛出错误
 */
export function getButtons(id: string): Array<HTMLButtonElement> {
  const els = document.getElementsByClassName(id);
  if (!els.length) {
    throw new Error(`Elements "${id}" not found.`);
  }
  const buttons: Array<HTMLButtonElement> = [];
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    if (!(el instanceof HTMLButtonElement)) {
      throw new Error(`Element ${i} of "${id}" not a button element.`);
    }
    buttons.push(el);
  }
  return buttons;
}

/**
 * 获取div容器元素
 * @param id div元素的ID
 * @returns HTMLDivElement div元素对象
 * @throws 如果元素不存在或不是div元素则抛出错误
 */
export function getDiv(id: string): HTMLDivElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLDivElement)) {
    throw new Error(`Element "${id}" not found or not a div element.`);
  }
  return el;
}

/**
 * 获取输入框元素
 * @param id 输入框元素的ID
 * @returns HTMLInputElement 输入框元素对象
 * @throws 如果元素不存在或不是输入框元素则抛出错误
 */
export function getInput(id: string): HTMLInputElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLInputElement)) {
    throw new Error(`Element "${id}" not found or not an input element.`);
  }
  return el;
}

/**
 * 获取span文本元素
 * @param id span元素的ID
 * @returns HTMLSpanElement span元素对象
 * @throws 如果元素不存在或不是span元素则抛出错误
 */
export function getSpan(id: string): HTMLSpanElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLSpanElement)) {
    throw new Error(`Element "${id}" not found or not a span element.`);
  }
  return el;
}

/**
 * 获取视频元素
 * @param id 视频元素的ID
 * @returns HTMLVideoElement 视频元素对象
 * @throws 如果元素不存在或不是视频元素则抛出错误
 */
export function getVideo(id: string): HTMLVideoElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLVideoElement)) {
    throw new Error(`Element "${id}" not found or not a video element.`);
  }
  return el;
}

/**
 * 获取文本区域元素
 * @param id 文本区域元素的ID
 * @returns HTMLTextAreaElement 文本区域元素对象
 * @throws 如果元素不存在或不是文本区域元素则抛出错误
 */
export function getTextArea(id: string): HTMLTextAreaElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLTextAreaElement)) {
    throw new Error(`Element "${id}" not found or not a video element.`);
  }
  return el;
}
