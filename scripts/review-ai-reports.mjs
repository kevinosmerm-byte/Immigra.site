import '../modules/citizenship/node_modules/dotenv/config.js';
import {createClient} from '../modules/citizenship/node_modules/@supabase/supabase-js/dist/index.mjs';
import {createAiReportStore,AI_REPORT_EVENT} from '../modules/citizenship/server/aiReportService.js';
const url=process.env.SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY;
if(!url||!secret)throw Error('Run only in a private operator shell with configured server credentials.');
const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}}),store=createAiReportStore({db,secret});
const result=await db.from('usage_events').select('user_id,metadata').eq('event_name',AI_REPORT_EVENT).order('created_at',{ascending:false}).limit(20);
if(result.error)throw Error('Private report review unavailable.');
const ids=new Set((result.data||[]).map(row=>row.metadata.reportId));
for(const userId of new Set((result.data||[]).map(row=>row.user_id).filter(Boolean))){for(const report of await store.exportForUser(userId))if(ids.has(report.reportId))process.stdout.write(JSON.stringify(report)+'\n');}
