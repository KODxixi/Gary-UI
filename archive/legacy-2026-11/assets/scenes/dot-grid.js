/* Compatibility entry. The single engine lives on the Portal's served shared route. */
(() => { const script=document.createElement('script');script.src=new URL('../../patterns/shared/dot-grid.js',document.currentScript.src);document.head.append(script); })();
