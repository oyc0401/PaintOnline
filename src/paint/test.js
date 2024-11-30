const debugState = makeState({name:'Kim', age:21});

debugState.changeState({name:'hello', age:12})

console.log(debugState.name)

debugState.match({
  'changename': {action: 'set', prop: 'name'}
})

debugState.on('changename',(name)=>{
  console.log('name:', name)
})

debugState.name = 'mike'; // name: mike