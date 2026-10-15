import argparse,os,pathlib,shutil,subprocess,tempfile
parser=argparse.ArgumentParser(description='Stream a PostgreSQL service backup directly into age encryption.')
parser.add_argument('--service',required=True);parser.add_argument('--recipient',required=True);parser.add_argument('--output',required=True)
args=parser.parse_args()
if not args.service.replace('_','').replace('-','').isalnum():parser.error('Use a PostgreSQL service name, not a connection string.')
if not args.recipient.startswith('age1'):parser.error('A verified age public recipient is required.')
for command in ['pg_dump','age']:
 if not shutil.which(command):parser.error(command+' is required')
output=pathlib.Path(args.output).expanduser().resolve()
if output.exists():parser.error('Refusing to overwrite an existing backup.')
output.parent.mkdir(parents=True,exist_ok=True)
fd,temporary=tempfile.mkstemp(prefix='.immigra-backup-',suffix='.age',dir=output.parent);os.close(fd);os.chmod(temporary,0o600)
try:
 dump=subprocess.Popen(['pg_dump','--format=custom','--no-owner','--no-acl','--no-password','--dbname=service='+args.service+' sslmode=verify-full'],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
 encrypted=subprocess.Popen(['age','--encrypt','--recipient',args.recipient,'--output',temporary],stdin=dump.stdout,stderr=subprocess.DEVNULL)
 dump.stdout.close();encrypted_code=encrypted.wait();dump_code=dump.wait()
 if encrypted_code or dump_code or pathlib.Path(temporary).stat().st_size==0:raise RuntimeError('Backup failed; incomplete output removed. Check private provider/tool configuration.')
 os.link(temporary,output);os.unlink(temporary);print('Encrypted backup saved. A separate restore test is still required.')
finally:
 pathlib.Path(temporary).unlink(missing_ok=True)
