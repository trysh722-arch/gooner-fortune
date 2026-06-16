# -*- coding: utf-8 -*-
# 자급자족 단일 HTML 생성: 모든 CSS/JS 인라인 + 이미지 base64 내장 + 스쿼드 포함 + 테스트버튼 ON
# 더블클릭만 하면 서버/폴더 의존 없이 도감·스쿼드까지 다 동작
import io, os, re, base64
R = os.path.dirname(os.path.abspath(__file__))
def read(p): return io.open(os.path.join(R, p), encoding='utf-8').read()

html = read('index.html')
col_css = read('collection.css')
col_js = read('collection.js')
bx_css = read(os.path.join('dev', 'bestxi.css'))
bx_js = read(os.path.join('dev', 'bestxi.js'))

# 외부 참조 제거(인라인으로 대체)
html = html.replace('<link rel="stylesheet" href="collection.css">', '')
html = html.replace('<script src="collection.js"></script>', '')

# CSS 인라인 (head)
html = html.replace('</head>', '<style>\n' + col_css + '\n' + bx_css + '\n</style>\n</head>', 1)

# JS 인라인 (body 끝): __DEVTEST → 도감 → 스쿼드 순
inject = ('<script>window.__DEVTEST=true;</script>\n'
          '<script>\n' + col_js + '\n</script>\n'
          '<script>\n' + bx_js + '\n</script>\n')
html = html.replace('</body>', inject + '</body>', 1)

# 이미지 base64 내장
imgdir = os.path.join(R, 'img')
cnt = 0
for fn in os.listdir(imgdir):
    if not fn.lower().endswith('.png'):
        continue
    with open(os.path.join(imgdir, fn), 'rb') as fh:
        b64 = base64.b64encode(fh.read()).decode('ascii')
    uri = 'data:image/png;base64,' + b64
    token = 'img/' + fn
    if token in html:
        html = html.replace(token, uri)
        cnt += 1

# 타이틀 표식
html = html.replace('<title>오늘의 구너 운세 — COYG</title>',
                    '<title>[로컬] 오늘의 구너 운세 — 도감·스쿼드</title>', 1)

out = os.path.join(R, '구너운세_로컬테스트.html')
io.open(out, 'w', encoding='utf-8').write(html)
print('생성:', out)
print('내장 이미지:', cnt, '장 / 파일크기:', round(len(html.encode('utf-8'))/1024/1024, 1), 'MB')
