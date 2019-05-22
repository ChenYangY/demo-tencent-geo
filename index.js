var fs = require('fs');
var parse = require('xml-parser');
const _ = require('lodash')
var xml_en = fs.readFileSync('./info/LocList_en.xml', 'utf8');
var xml_zh = fs.readFileSync('./info/LocList_zh.xml', 'utf8');
const util = require('util')
const country_sql_path = './output/country.exec.txt' 
var obj_zh = parse(xml_zh);
var obj_en = parse(xml_en);

// console.log(util.inspect(obj_zh,{depth:1}))
// console.log(util.inspect(obj_en,{depth:1}))

const countryNames = ['新西兰', '美国', '英国', '中国香港']


function findItemByName(list, name) {
  const Index = _.findIndex(list, (o) => {
    return ele === o.attributes.Name
  })
  if(index < 0) return ; 
  return list[index]
}

function findItemByCode(list, code) {
  const Index = _.findIndex(list, (o) => {
    return code === o.attributes.Code
  })
  if(index < 0) return ; 
  return list[index]
}

function generate_country_sql() {
  countryListEn = obj_en.root.children
  countryListCn = obj_zh.root.children
  let lists = []
  let code
  let str = 'db.country.insertMany([\n'
  countryNames.forEach((ele) => {
    
    const CountryItemCn = findItemByName(countryListCn, ele)
    if(!CountryItemCn) return
    code = CountryItemCn.attributes.Code
    const enIndex = findItemByName(countryListEn, )
    if(enIndex < 0) return 
    let item = {}
    item.name = countryListCn[cnIndex].attributes.Name
    item.NameEn = countryListEn[enIndex].attributes.Name
    str += JSON.stringify(item) + ',\n'
  })
  str += '])'
  
  fs.writeFileSync(country_sql_path, str)
}

const country_ids = ['ObjectId("5ce51dc0caeec2d948060ce6")', 'ObjectId("5ce51dc0caeec2d948060ce7")', 'ObjectId("5ce51dc0caeec2d948060ce8")', 'ObjectId("5ce51dc0caeec2d948060ce9")']
function generate_province_sql() {
  countryNames.forEach((ele) => {
    const cnIndex = _.findIndex(countryListCn, (o) => {
      return ele === o.attributes.Name
    })
    if(cnIndex < 0) return 
    code = countryListCn[cnIndex].attributes.Code
    const enIndex = _.findIndex(countryListEn, (ele) => {
      return code === ele.attributes.Code
    })
    if(enIndex < 0) return 
    let item = {}
    item.name = countryListCn[cnIndex].attributes.Name
    item.NameEn = countryListEn[enIndex].attributes.Name
    str += JSON.stringify(item) + ',\n'
  })
  str += '])'
  
  fs.writeFileSync(country_sql_path, str)
}

generate_country_sql()