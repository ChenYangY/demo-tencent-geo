var fs = require('fs');
var parse = require('xml-parser');
const _ = require('lodash')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId 
var xml_en = fs.readFileSync('./info/LocList_en.xml', 'utf8');
var xml_zh = fs.readFileSync('./info/LocList_zh.xml', 'utf8');
const util = require('util')
const country_sql_path = './output/country.exec.txt' 
const outputPath = './output/exec_str.txt' 
var obj_zh = parse(xml_zh);
var obj_en = parse(xml_en);

// console.log(util.inspect(obj_zh,{depth:1}))
// console.log(util.inspect(obj_en,{depth:1}))

const countryNames = ['新西兰', '美国', '英国', '中国', '澳大利亚']
const specialCity = ['香港', '澳门','台湾','北京', '上海', '天津', '重庆']

let countries_cn_data = []
let countries_en_data = []
let countries = []

function findItemByName(list, name) {
  const index = _.findIndex(list, (o) => {
    return name === o.attributes.Name
  })
  if(index < 0) return ; 
  return list[index]
}

function findItemByCode(list, code) {
  const index = _.findIndex(list, (o) => {
    return code === o.attributes.Code
  })
  if(index < 0) return ; 
  return list[index]
}

function itemToString(item) {
  const keys = Object.keys(item)
  const fields = ['_id', 'provinceId', 'countryId']
  let str = '{'
  _.each(keys, (ele) => {
    str += '"' + ele + '" : '
    if(_.includes(fields, ele)) {
      str += 'ObjectId("' + item[ele].toString() + '"), ' 
    } else {
      str += '"' +item[ele].toString() + '" ,'
    }
  })
  str = str.slice(0,-2) + '}'
  return str
}

function handle_special_country(countryId) {
  let exec_str = '// 插入香港数据 \n db.getCollection("province").insertMany(['
  itemProvince = {
    _id: ObjectId(),
    name: '香港',
    nameEn: 'Hong Kong',
    countryId: countryId
  }
  exec_str += itemToString(itemProvince) + '])\n// 插入香港相关数据\n db.getCollection("city").insertMany(['
  itemCity = {
    _id: ObjectId(),
    name: '香港',
    nameEn: 'Hong Kong',
    provinceId: itemProvince._id
  }
  exec_str += itemToString(itemCity) + '])\n'
  return exec_str
}
function generate_country_sql() {
  countryListEn = obj_en.root.children
  countryListCn = obj_zh.root.children
  let lists = []
  let code
  let child_exec_str = ''
  let exec_str = '// 插入国家数据 \ndb.getCollection("country").insertMany([\n'
  countryNames.forEach((ele) => {
    let countryItemCn = findItemByName(countryListCn, ele)
    if(!countryItemCn) return
    code = countryItemCn.attributes.Code
    let countryItemEn = findItemByCode(countryListEn, code)
    if(!countryItemEn) return
    let item = {}
    item._id = ObjectId()
    item.name = countryItemCn.attributes.Name
    item.nameEn = countryItemEn.attributes.Name
    exec_str += itemToString(item) + ',\n'
    child_exec_str += generate_children_sql(item, countryItemCn, countryItemEn, 'province', 'countryId')    
  })
  let specialItem = {
    _id: ObjectId(),
    name: '中国香港',
    nameEn: 'Hong Kong'
  }
  exec_str += itemToString(specialItem) + '\n])\n\n'
  child_exec_str += handle_special_country(specialItem._id)
  exec_str += child_exec_str
  
  fs.writeFileSync(outputPath, exec_str)
}

function generate_children_sql(rootItem, rootItemCn, rootItemEn, collection, field) {
  
  let cnChildren = (rootItemCn && rootItemCn.children) || []
  let enChildren = (rootItemEn && rootItemEn.children) || []
  let isChildren = true
  if (collection === 'province' && cnChildren.length === 1 && !cnChildren[0].attributes.Name) {
    cnChildren = cnChildren[0].children
    if (enChildren.length !== 1 || enChildren[0].attributes.Name) {
      throw new Error('data error')
    }
    enChildren = enChildren[0].children
    isChildren = false
  } else if(cnChildren.length <= 0) return ''

  
  let exec_str = '// 插入'+ rootItem.name +'数据 \ndb.getCollection("'+ collection +'").insertMany([\n'
  let child_exec_str = ''
  cnChildren.forEach((itemCn, index, list) => {
    let item = {}
    item._id =  ObjectId()
    item.name = itemCn.attributes.Name || ''
    let itemEn = findItemByCode(enChildren, itemCn.attributes.Code)
    if(!itemEn) {
      item.nameEn = ''
    } else {
      item.nameEn = itemEn.attributes.Name
    }
    item[field] = rootItem._id
    if(index === list.length -1) {
      exec_str += itemToString(item) + '\n'
    } else {
      exec_str += itemToString(item) + ',\n'
    }
    if(collection !== 'city') {
      if(_.includes(specialCity, itemCn.attributes.Name)) {
        child_exec_str += generate_children_sql(item, {children:[itemCn]}, {children:[itemEn]}, 'city', 'provinceId')
      } else {
        if(isChildren) {
          child_exec_str += generate_children_sql(item, itemCn, itemEn, 'city', 'provinceId')
        } else {
          child_exec_str += generate_children_sql(item, {children:[itemCn]}, {children:[itemEn]}, 'city', 'provinceId')
        }
      }
      
    }
  })
  exec_str = exec_str.slice(0,-1) + '])\n\n'
  exec_str += child_exec_str
  return exec_str
  // fs.writeFileSync(outputDir+ collection +'.txt', str)
}


generate_country_sql()

// generate_province_sql()