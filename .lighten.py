# 배경(무채색)만 밝게 뒤집고, 데이터 색(유채색)은 그대로 둡니다.
# 계열 색이 뜻을 갖는 차트(범례)를 훼손하지 않기 위해서입니다.
import sys, io, colorsys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from PIL import Image
import numpy as np

def lighten_bg(src, dst, tint_hue=205, tint_sat=0.14, chroma_dark=0.86, sat_cut=0.42,
               knee=0.80, white=0.94):
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float32) / 255.0
    h, w, _ = a.shape
    flat = a.reshape(-1, 3)
    mx = flat.max(1); mn = flat.min(1); L = (mx + mn) / 2; d = mx - mn
    S = np.where(d < 1e-6, 0, d / np.where(L < 0.5, mx + mn + 1e-9, 2 - mx - mn + 1e-9))
    H = np.zeros_like(L); r, g, b = flat[:, 0], flat[:, 1], flat[:, 2]; m = d > 1e-6
    ir = m & (mx == r); ig = m & (mx == g) & ~ir; ib = m & (mx == b) & ~ir & ~ig
    H[ir] = ((g - b)[ir] / d[ir]) % 6
    H[ig] = ((b - r)[ig] / d[ig]) + 2
    H[ib] = ((r - g)[ib] / d[ib]) + 4
    H *= 60
    out = np.zeros_like(flat)

    neutral = S < sat_cut
    nl = np.clip(1.0 - L[neutral] * 0.92, 0, 1)
    # 배경이 회색으로 뜨지 않게, 밝은 쪽 끝만 흰색까지 늘립니다 (글자 대비는 유지)
    top = nl > knee
    nl[top] = knee + (nl[top] - knee) * ((1.0 - knee) / max(white - knee, 1e-6))
    nl = np.clip(nl, 0, 1)
    ss = np.clip(tint_sat * (1.15 - nl), 0, 1)
    rr, gg, bb = np.vectorize(lambda l, s: colorsys.hls_to_rgb(tint_hue / 360.0, l, s))(nl, ss)
    out[neutral] = np.stack([rr, gg, bb], axis=1)

    # 유채색 — 색상(hue)과 채도는 그대로, 밝기만 낮춰 흰 배경에서 읽히게 합니다
    c = ~neutral
    ll = np.clip(L[c] * chroma_dark, 0, 1)
    s2 = np.clip(S[c] * 1.02, 0, 1)
    rr, gg, bb = np.vectorize(lambda h_, l, s: colorsys.hls_to_rgb(h_ / 360.0, l, s))(H[c], ll, s2)
    out[c] = np.stack([rr, gg, bb], axis=1)

    Image.fromarray((out.reshape(h, w, 3) * 255).clip(0, 255).astype(np.uint8)).save(dst)
    print('ok', dst)

if __name__ == '__main__':
    for n in ['ds-pipeline', 'ds-arch', 'ds-transfer', 'ds-cover', 'ds-curve']:
        lighten_bg(f'.bak-img/{n}.png', f'assets/img/{n}.png')
