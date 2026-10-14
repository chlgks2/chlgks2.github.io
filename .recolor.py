import sys,io,colorsys
sys.stdout=io.TextIOWrapper(sys.stdout.buffer,encoding='utf-8')
from PIL import Image
import numpy as np

def recolor(src,dst,nh,ns,ah,sh,warm_cut=90):
    im=Image.open(src).convert('RGB')
    a=np.asarray(im).astype(np.float32)/255.0
    h,w,_=a.shape; flat=a.reshape(-1,3)
    mx=flat.max(1); mn=flat.min(1); L=(mx+mn)/2; d=mx-mn
    S=np.where(d<1e-6,0,d/np.where(L<0.5,mx+mn+1e-9,2-mx-mn+1e-9))
    H=np.zeros_like(L); r,g,b=flat[:,0],flat[:,1],flat[:,2]; m=d>1e-6
    ir=m&(mx==r); ig=m&(mx==g)&~ir; ib=m&(mx==b)&~ir&~ig
    H[ir]=((g-b)[ir]/d[ir])%6; H[ig]=((b-r)[ig]/d[ig])+2; H[ib]=((r-g)[ib]/d[ib])+4; H*=60
    out=np.zeros_like(flat)
    neutral=S<0.55
    nl=np.clip(1.0-L[neutral]*0.90,0,1)
    # 밝은 영역일수록 채도를 낮춰 배경이 탁해지지 않게 한다
    ss=np.clip(ns*(1.18-nl),0,1)
    rr,gg,bb=np.vectorize(lambda l,s: colorsys.hls_to_rgb(nh/360.0,l,s))(nl,ss)
    out[neutral]=np.stack([rr,gg,bb],axis=1)
    for mask,hue in (((~neutral)&(H>=warm_cut),ah),((~neutral)&(H<warm_cut),sh)):
        if mask.sum()==0: continue
        ll=np.clip(L[mask]*0.90,0,1); s2=np.clip(S[mask]*0.95,0,1)
        rr,gg,bb=np.vectorize(lambda l,s: colorsys.hls_to_rgb(hue/360.0,l,s))(ll,s2)
        out[mask]=np.stack([rr,gg,bb],axis=1)
    Image.fromarray((out.reshape(h,w,3)*255).clip(0,255).astype(np.uint8)).save(dst)
