// Synthetic, labelled corpus: same candidates/seeds for both implementations.
const themes=[
 ['science','Astronomia','Il telescopio raccoglie la luce delle stelle. Uno specchio riflette i raggi e permette di osservare pianeti lontani. Per esempio, un osservatorio misura le orbite dei pianeti durante il passaggio davanti alle stelle.'],
 ['nature','Coralli','La barriera corallina ospita pesci e piccoli organismi marini. I coralli costruiscono uno scheletro calcareo che protegge la costa dalle onde. Per esempio, i pesci trovano rifugio tra i rami della barriera corallina.'],
 ['technology','Batterie','Una batteria conserva energia mediante reazioni chimiche. Gli elettroni attraversano un circuito e alimentano un motore elettrico. Per esempio, un accumulatore ricaricabile fornisce energia a una bicicletta durante il viaggio.'],
 ['history','Pompei','La città di Pompei conserva tracce delle abitazioni romane. La cenere del vulcano ha protetto dipinti e utensili dalla pioggia. Per esempio, gli scavi mostrano come gli abitanti distribuivano acqua nelle case.'],
 ['arts','Mosaici','Il mosaico riunisce tessere colorate per rappresentare una figura. Le tessere riflettono la luce in direzioni diverse e creano sfumature. Per esempio, un artigiano dispone piccoli frammenti di vetro su una parete.'],
 ['food','Lieviti','Il lievito trasforma gli zuccheri durante la fermentazione del pane. Il gas prodotto si espande e crea bolle nella pasta. Per esempio, una temperatura moderata favorisce lo sviluppo degli aromi durante la preparazione.'],
 ['geography','Ghiacciai','Il ghiacciaio trasporta rocce lungo una valle. La pressione del ghiaccio modifica il paesaggio e scava una conca. Per esempio, dopo il ritiro del ghiacciaio un lago occupa la depressione lasciata nella montagna.'],
 ['sport','Arrampicata','La corda protegge chi pratica arrampicata su una parete. Un dispositivo di assicurazione distribuisce la forza e rallenta una caduta. Per esempio, due compagni controllano i nodi prima di iniziare la salita.']];
const article=(theme,i,prefix='candidate')=>{const [category,title,text]=themes[theme];return {id:`${prefix}-${theme}-${i}`,source:`https://it.wikipedia.org/wiki/${prefix}_${theme}_${i}`,title:`${title} ${i}`,category,preview:[text],paragraphs:[text],fetchedAt:1}};
const rows=Array.from({length:80},(_,i)=>article(i%8,Math.floor(i/8)));
const events=(theme,count,kind='save')=>Array.from({length:count},(_,i)=>({article:article(theme,i,'signal'),kind}));
const scenarios={cold:[],accidental:events(0,1,'open'),saves2:events(0,2),saves3:events(0,3),opens5:events(0,5,'open'),switch:[...events(1,20),...events(0,3)],alternating:Array.from({length:6},(_,i)=>({article:article(i%2,i,'alternating'),kind:'save'})),undo:[...events(0,1),{article:article(0,0,'signal'),kind:'unsave'},...events(0,1)],repeated:Array(12).fill({article:article(0,0,'signal'),kind:'open'}),scarce:events(0,3)};
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
module.exports={themes,article,rows,events,scenarios,rng};
