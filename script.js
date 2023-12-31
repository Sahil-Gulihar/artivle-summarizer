const SummaryBot = require('summarybot')
const summarizer = new SummaryBot()

document.getElementById('output').innerHTML=function Sum(){

  const text = document.getElementById('input').value ;

  const output= summarizer.run(text, 5, false) ;

  return output;

};