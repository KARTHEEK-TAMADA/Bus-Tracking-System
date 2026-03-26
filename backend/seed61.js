const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'bus_tracking.sqlite'));

const areas = [
  'Amaravathi', 'Pedaparimi', 'Thulluru', 'Namburu', 'Chowdavaram', 'Lal Puram', 'Chilakaluripet', 
  'China Kakani', 'Kaza', 'Yarrabalem', 'Nallapadu', 'Perecharla', 'Narasaraopet', 'Phirangipuram', 
  'Nudurupadu', 'Sattenapalli', 'Medikonduru', 'Bhiminenivaripalem', 'Visadala X Roads', 'Korrapadu', 
  'Kunchena Palli', 'Halfpeta', 'Kolakaluru', 'Nandivelugu', 'Kollipara', 'Takkellapadu', 'Tenali', 
  'Kolluru', 'Revendrapadu', 'Tummapudi', 'Nuthakki', 'Peda Vadlapudi', 'Duggirala', 'Etukuru', 
  'Gannavaram', 'Tadepalli', 'Tadikonda', 'Lam', 'Peda Kakani', 'Pedanandi Padu', 'Prathipadu', 
  'Pulladigunta', 'Kantheru', 'Narakoduru', 'Yadlapadu', 'Kantheru X Road', 'Uppalapadu', 
  'Venkata Krishna Puram', 'Peda Palakaluru', 'Ponnur', 'Chebrolu', 'Budampadu', 
  'Nunna Via Sing Nagar', 'Raveli Via Ponnekallu', 'Penamaluru Via Poranki', 'Bapatla Via Ponnuru', 
  'Sekuru Via Narakoduru', 'Cherukupalli Via Chandole', 'Chiluvuru', 'Koppuravuru', 'Ibrahimpatnam Via Gollapudi'
];

db.serialize(() => {
  const insertStmt = db.prepare("INSERT INTO Routes (name, start_origin, end_destination) VALUES (?, ?, 'VVIT Campus')");
  
  areas.forEach(area => {
    insertStmt.run(area + ' Route', area);
  });
  
  insertStmt.finalize(() => {
    console.log('Successfully completed seeding 61 paths.');
    db.close();
  });
});
