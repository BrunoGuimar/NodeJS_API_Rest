const express = require('express')
const app = express()

const {v4: uuidv4} = require('uuid')

app.use(express.json())

const inventory = []
const history = []

function getStratum(history){
    const balance = history.reduce((acc, {price, type, amount})=>{
        if(type === "bought"){
          return acc - price
        }else if(type === "sold"){
          return acc + price
        }else if(type === "deleted"){
           return acc + price * amount
        }
    }, 0)
    return balance
}

app.post('/product', (req, res) => {
const { name, price } = req.body
const productAlreadyExists = inventory.find(product => product.name === name)
if(!name || !price){
    return res.json({error: "Name and Price must be provided"})
}else{
if(!productAlreadyExists){
    inventory.push({ 
        name, 
        price,
        id: uuidv4(),
        amount: 1
    })
}else{
    productAlreadyExists.amount += 1
}
history.push({
    name,
    price,
    dated_at: new Date(),
    type: "bought"
})
res.status(201).send()
}})

app.post('/product/:name', (req, res) => {
const {name} = req.params
const {price} = req.body
const product = inventory.find(product => product.name === name)
const productIndex = inventory.findIndex(product => product.name === name);
if (productIndex === -1) {
  return res.status(404).json({ error: 'Product not found!' });
}else if(product.amount === 1){ 
    inventory.splice(productIndex, 1)
    history.push({
        name: product.name,
        price: price,
        dated_at: new Date(),
        type: "sold"
        })
    return res.status(200).json()
}
product.amount -= 1
history.push({
    name: product.name,
    price: price,
    dated_at: new Date(),
    type: "sold"
    })
    return res.status(200).json()
})

app.get('/inventory', (req, res) => {
    res.json(inventory)
})

app.get('/history', (req, res) => {
    res.json(history)
})

app.put('/product/:id', (req, res) => {
    const {name, price} = req.body
    const {id} = req.params
    const product = inventory.find(product => product.name === id)
    const sameNameProduct = inventory.some(product => product.name == name)
    if (product === undefined) {
        return res.status(404).json({ error: 'Product not found!' });
      }else if(sameNameProduct === true){
        return res.status(404).json({ error: 'Product name already exists!' });
      }
    product.name = name
    product.price = price
return res.status(200).json({message: "modifications made successfully!"})
})

app.delete('/product/:id', (req, res) => {
const {id} = req.params
const product = inventory.find(product => product.name === id || product.id === id)
const productIndex = inventory.findIndex(product => product.name === id || product.id === id);
if (productIndex === -1) {
  return res.status(404).json({ error: 'Product not found!' });
}
    inventory.splice(productIndex, 1)
    history.push({
        name: product.name,
        price: product.price,
        amount: product.amount,
        id: product.id,
        dated_at: new Date(),
        type: "deleted"
        })
    return res.status(200).json({message: "Product deleted successfully"})
})

app.get('/stratum', (req, res) => {
    const stratum = getStratum(history)
    res.json(stratum)
})

app.get("/history/date", (request, response) => {
    const { date } = request.query;
  
    const formatedDate = new Date(date).toLocaleDateString();
    console.log(formatedDate)
    const dates = history.filter(
      ({dated_at}) => dated_at.toLocaleDateString() === formatedDate
    );
  
    return response.status(200).json(dates);
  })
app.listen(3030, () => console.log("Server On !"))