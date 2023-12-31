const SummaryBot = module('summarybot')
const summarizer = new SummaryBot()
const text="Waldo, and the eternal search for him, can actually tell us quite a lot about design. In many ways, Waldo is a great example of what NOT to do when using wee things in your own work. So with Waldo as our anti-hero, let's take a look at how people read and interpret small visual forms, why tiny details can be hugely useful, and what principles we can apply to make all these little images and moments work for us as designers."

console.log(summarizer.run(text, 5, false))
