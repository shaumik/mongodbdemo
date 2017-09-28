#!/usr/bin/env python
# Script: crawler.py

import mechanize, re, sys, json, datetime, copy, time, threading
from bs4 import BeautifulSoup

class intCount(object):
	"""Generates a stream of consecutive integers.
	Primarily used in this program to keep track of 
	which threads have which output

	Returns an integer one more than the last each time it is called.
	"""
	def __init__(self):
		self.current = 1

	def __next__(self):
		result = self.current
		self.current += 1
		return result

	def __iter__(self):
		return self

class Queue:
	"""The simplest queue implementations you can imagine.
	As one of the most famous data structures known, this 
	child hopes to one day, become a leading figure of his 
	clan.

	>>> foo = Stack()
	>>> foo.long
	0
	>>> foo.enqueue(4)
	>>> foo.enqueue(5)
	>>> foo.long
	2
	>>> foo.dequeue()
	5
	>>> foo.long
	1
	"""
	def __init__(self):
		self.line = []
		self.long = 0

	def enqueue(self, item):
		self.line.append(item)
		self.long += 1

	def dequeue(self):
		item = self.line[0]
		self.line = self.line[1::]
		self.long -= 1
		return item

	def listForm(self):
		return self.line

	def __repr__(self):
		return str(self.line)

class Crawler:
	def __init__(self, threadNum=0):
		#create browser and configure settings
		self.br = mechanize.Browser()
		self.cj = mechanize.CookieJar()

		self.br.set_cookiejar(self.cj)
		self.br.set_handle_equiv(True)
		self.br.set_handle_redirect(True)
		self.br.set_handle_referer(True)
		self.br.set_handle_robots(False)
		self.br.addheaders = [('User-agent', 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.1) Gecko/2008071615 Fedora/3.0.1-1.fc9 Firefox/3.0.1')]
		self.checked = []

		self.productURLs = {}
		self.data = []
		self.products = []
		self.site = ""
		self.threadNum = threadNum

	def isProductRules(self, tag):
		"""Specific rules for each website for determining whether the page
		is a product page.
		"""
		if 'kaspersky' in self.site:
			return "product-head--title" in tag['class']
		else:
			return True
	def headerNum(self):
		"""Returns the number for headers

		Returns an integer for the header
		"""
		if "mcafee" in self.site:
			return 2
		else:
			return 4

	def isProduct(self, siteSoup):
		"""Generic function to check page is product page using heading tags
		"""
		try:
			for num in range(1,self.headerNum()):
				for tag in siteSoup.find_all('h'+str(num)):
					for product in self.products:
						tagText = ''.join([char for char in tag.get_text() if 0 < ord(char) < 127])
						tagText = " ".join(tagText.split())
						match = True
						for productWord in product.split():
							if productWord not in tagText:
								match = False
								break
						for tagWord in tagText.split():
							if tagWord not in product:
								try:
									tagWord = int(tagWord)
									if tagWord in range(int(datetime.datetime.now().year)-10, int(datetime.datetime.now().year)+10):
										pass
								except Exception, e:
									match = False
									break
						if match and self.isProductRules(tag):
							self.products.pop(self.products.index(product))
							return True, product

		except Exception, e:
			print str(self.threadNum)+'\tError found in isProduct: '+str(e)
		return False, None

	def upstream(self, link, lastChar=""):
		"""Returns a link that is one directory above the current one
		"""
		if lastChar != "":
			if link[-1] == "/":
				return link
			else:
				return self.upstream(link[0:-1], lastChar)
		else:
			if link[-1] == '/':
				end = re.search('/[^/]+/$', link).group(0)
				return self.upstream(link[0:link.index(end)], '/')
			else:
				end = re.search('/[^/]+$', link).group(0)
				return self.upstream(link[0:link.index(end)], '/')
	def equivRules(self, link):
		"""More rules for equiv are placed here
		"""
		if 'kaspersky' in self.site:
			return 'http' not in link and 'www' not in link

	def equiv(self, link, currURL, first=True):
		"""Returns the equivalent of a link passed in!
		"""
		if re.search('\.\./', link):
			return self.equiv(link[0:link.index('../')]+link[link.index('../')+3::], self.upstream(currURL), False)
		elif first:
			if self.equivRules(link):
				if bool(re.search('/$', currURL)) ^ bool(re.search('^/', link)):
					return currURL+link
				elif bool(re.search('/$', currURL)) and bool(re.search('^/', link)):
					return currURL+link[1]
				else:
					return currURL+'/'+link
			else:
				return link
		else:
			return currURL+link

	def formatLink(self, link, currURL=""):
		"""Formats the link that is passed in based on certain patterns

		Returns the shortened link.
		"""
		if currURL != "":
			link = self.equiv(link, currURL)
			print link
		if re.search('^/',link):
			if bool(re.search('^/', link)) ^ bool(re.search('/$', self.site)):
				link = self.site+link
			elif bool(not re.search('^/', link)) and bool(not re.search('/$', self.site)):
				link = self.site + '/'+link
			else:
				link = self.site+link[1::]
		if re.search('https', link):
			link = link.replace('https','http')
		if '?' in link:
			return link[:link.index('?')]
		elif ';' in link:
			return link[:link.index(';')]
		elif '#' in link:
			return link[:link.index('#')]
		else:
			return link

	def repeatRules(self, newURL):
		"""uses rules to determine whether or not to continue with website


		Returns a boolean value
		"""
		return str(re.search('.*\..*\.com/',self.site).group(0)) not in newURL or re.search('countries\.do$', newURL) or re.search('download', newURL)

	def isRepeat(self, url, toDo):
		"""Checks for repeated URLs in queue and checked URLs

		Returns a boolean value
		"""
		for toDoLink in toDo.line:
			if url == self.formatLink(toDoLink):
				return True
		return toDo.line and url in self.checked or self.repeatRules(url)
		
	def crawlSite(self):
		"""Crawl each country-specific site.
		Iterative, not recursive. Otherwise function will be overwhelmed
			
		toDo.line keeps track of full URL's

		Returns a list of product page urls
		"""
		toDo = Queue()
		toDo.enqueue(self.formatLink(self.site))
		while toDo.long > 0 and self.products:
			currURL = toDo.dequeue()
			try:
				html = self.br.open(currURL)
				siteSoup = BeautifulSoup(html.read())
				self.checked.append(currURL)
				isProduct, productMatch = self.isProduct(siteSoup)
				if isProduct:
					self.productURLs[productMatch] = currURL
					continue
				links = list(self.br.links())
				for link in links:
					url = str(link.url)
					print url
					try:
						newURL = self.formatLink(url, currURL)
						print url+"\t>>>\t"+newURL
						if self.isRepeat(newURL, toDo):
							continue
						print "success @\t\t" + newURL
						toDo.enqueue(newURL)
						# self.br.back()	
					except Exception, e:
						error = str(self.threadNum) + '\t(inner) '+str(e) + " @:\t<"+str(url)+"> in <"+str(currURL)+">"
						print error
						with open('error.txt','a') as fi:
							fi.write(error+'\n')				
			except Exception, e:
				error = str(self.threadNum)+"\t<<ERROR>> found at(outer):\t"+str(currURL)+'\t'+str(e)
				print error
				with open('error.txt','a') as fi:
					fi.write(error+'\n')

	def crawl(self, site):
		"""Driver of entire crawler

		Returns data in a json format
		"""
		self.data = site
		masterList = []
		if site["checked"] == 0:
			self.productURLs = {}
			self.products = copy.copy(site["products"])
			self.site = site["URL"]
			timeStamp = str(datetime.datetime.utcnow())
			productsList = []
			self.crawlSite()
			for product in site["products"]:
				try:
					productsList.append({'productName':product,'productUrl':self.productURLs[product]})
				except Exception, e:
					with open('error.txt','a') as fi:
						fi.write(str(self.threadNum)+"\tError from getting products from <"+self.site+">\n")
					productsList.append({'productName':product,'productUrl':''})
			siteData = {}
			siteData["vendor"] = self.site
			siteData["products"] = productsList
			siteData["timeStamp"] = timeStamp
			#Record siteData into file
			writerQueue.enqueue(siteData)	
			site["checked"] = 1
		self.br.close()

		
def runWorker(site):
	threadNum = threadCounter.__next__()
	print threadNum
	siteCrawler = Crawler(threadNum)
	siteCrawler.crawl(site)
	
threadCounter = intCount()
writerQueue = Queue()

if __name__ == "__main__":
	print 'Argument List:', str(sys.argv)
	print 'Number of arguments:', len(sys.argv), 'argument(s).'
	assert len(sys.argv)==1, "Incorrect number arguments. Format should be: ./crawler.py"
	
	#Retrieve sites and product name information
	json_data = open('sites.json')
	data = json.load(json_data)
	json_data.close()

	threadList = []
	print 'thread?'
	for site in data:
		print "CREATE THREAD"
		t = threading.Thread(target=runWorker, args = (site,))
		threadList.append(t)
		t.start()
	for thread in threadList:
		thread.join()
	print datetime.datetime.utcnow()
	with open('out.json', 'a') as fi:
		print json.dumps(writerQueue.line, sort_keys=True, indent=4, separators=(',', ': '))
		fi.write(str(json.dumps(writerQueue.line, sort_keys=True, indent=4, separators=(',', ': '))))


	






