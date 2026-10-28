import argparse,json,urllib.request,urllib.error
parser=argparse.ArgumentParser(description='Read-only Immigra service checks; no AI or payment requests.')
parser.add_argument('--base',default='https://immigra.site');parser.add_argument('--billing',action='store_true');args=parser.parse_args()
base=args.base.rstrip('/');checks=[]
def check(path,expected=200):
 try:
  response=urllib.request.urlopen(base+path,timeout=25);body=response.read();status=response.status;headers=response.headers
 except urllib.error.HTTPError as error:status=error.code;body=error.read();headers=error.headers
 checks.append((path,status==expected));print(path,status,'PASS' if status==expected else 'FAIL')
 return body,headers
try:
 body,headers=check('/');
 for name in ['Content-Security-Policy','X-Content-Type-Options','Referrer-Policy','Permissions-Policy']:
  ok=bool(headers.get(name));checks.append((name,ok));print(name,'PASS' if ok else 'FAIL')
 for path in ['/healthz','/privacy','/terms','/support','/delete-account','/robots.txt','/sitemap.xml','/social/immigra-preview-20261015.png']:check(path)
 check('/api/account/usage',401)
 if args.billing:
  body,_=check('/api/billing/status');data=json.loads(body);ok=data.get('ready') is True;checks.append(('billing readiness',ok));print('billing readiness','PASS' if ok else data.get('reason','UNVERIFIED'))
except Exception as error:
 print('Network verification failed:',type(error).__name__);raise SystemExit(1)
raise SystemExit(0 if all(ok for _,ok in checks) else 1)
