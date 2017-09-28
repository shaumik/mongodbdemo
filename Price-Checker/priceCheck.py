import re
import sys

from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

'''
TODO:
-Exception Handling
-phantom browser
-bumblebee testing
-saveToDB
-integration with crawler
'''



'''
The function does simple checking and printing
'''
def priceChecking(disPrice,cartPrice):
    disPrice = re.sub(',','',re.search('([0-9]+[\.\, ][0-9]+|[0-9]+)', disPrice).group(0))
    cartPrice = re.sub(',','',re.search('([0-9]+[\.\, ][0-9]+|[0-9]+)', cartPrice).group(0))
    print '[' + disPrice + '];[' + cartPrice + ']'
    if(disPrice == cartPrice):
        return True
    else:
        return False


'''
simulator simulates a browser user to click and add item into cart.
@parameter urls is the list of products urls
'''
def simulatorNorton(urls):
    for url in urls:
        browser = webdriver.Chrome()
        browser.get(url)
        #checking if update to bumblebee
        options = browser.find_elements_by_class_name("radio")
        if(len(options)==0):
            options = []
            #indexing the options
            for radio in browser.find_elements_by_id("BuyButtonRadio"):
                options.append(radio.get_attribute('value'))
            for option in options:
                browser.find_element_by_xpath("//input[@value='" + option + "']").click()
                displayPrice = browser.find_element_by_class_name('newPriceAmt').text
                browser.find_element_by_class_name('PD-CTA-button').click()
                browser.implicitly_wait(8)
                cartPrice = browser.find_element_by_class_name('price').text
                if(not priceChecking(displayPrice,cartPrice)):
                    detectMismatch(url, option)
                else:
                    print "This price is matched / " + url

                try:
                    remove = browser.find_element_by_xpath("//td[@class='center border_right']/a")
                    remove.click()
                except Exception as e:
                    print e
                browser.get(url)
        else:
            for option in options:
                '''
                Connie's code is awesome!...but haven't refactored yet.
                '''
		option.click()
		product_price = option.find_element_by_tag_name("input").get_attribute("data-current")
		product_label = option.find_element_by_tag_name("label").text
		cart_link = browser.find_element_by_class_name("btn-buy").get_attribute('href')
		priceCheck(product_label,cart_link,product_price)
        browser.quit()
            
            

'''
The function is Parsing JSON data from crawler which is gathering those products url from base url(vendor).
right now its hard coded.
'''
def parseJSON():
    import json
    from pprint import pprint
    urls=[]
    json_data=open('sample.json')
    vendors = json.load(json_data)
    json_data.close()

    for vendor in vendors:
        for product in vendor['products']:
            urls.append(product['productUrl'])
    return urls
    
'''
The action that checker found mismatches. Do some notifications afterward.

'''
def detectMismatch(url, option):
    print "RED ALERT!!MISMATCH!!!!!!!!!\nHappended in url:"+url+"\noption:"+option
    

def main():
    testURL=['https://cl.norton.com/norton-360-multi-device/']
    simulatorNorton(testURL)

if __name__ == '__main__':
    main()
