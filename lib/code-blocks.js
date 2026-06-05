/**
 * Wrap prose `<pre>` blocks with a copy button.
 *
 * @param {ParentNode} root
 * @param {{ copyIcon: string }} icons
 */
export function enhanceCodeBlocks(root, { copyIcon }) {
  if (!root || !copyIcon) return;

  root.querySelectorAll('.prose pre').forEach((pre) => {
    if (pre.closest('.code-block-wrap')) return;

    const wrap = document.createElement('div');
    wrap.className = 'code-block-wrap';

    const block = document.createElement('div');
    block.className = 'code-block';

    const toolbar = document.createElement('div');
    toolbar.className = 'code-block__toolbar';
    toolbar.setAttribute('aria-label', 'Code block actions');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-block__copy btn-icon btn-ghost';
    btn.setAttribute('aria-label', 'Copy code');
    btn.innerHTML = copyIcon;

    pre.replaceWith(wrap);
    toolbar.append(btn);
    block.append(pre);
    wrap.append(block, toolbar);
  });
}

/** @param {HTMLButtonElement} button */
export async function copyCodeFromButton(button) {
  const pre = button.closest('.code-block-wrap')?.querySelector('pre');
  if (!pre) return false;

  const text = pre.textContent ?? '';
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}
