const SummaryBot = require('summarybot')
const summarizer = new SummaryBot()

function Sum(){
  const text = document.getElementById('input').value ;
  const output= SummaryBot(text,5) 
    return output;
}

document.getElementById('output').innerHTML = Sum()
