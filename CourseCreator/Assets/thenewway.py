# a new design to rule the world


# A shop 
class ShopSync:
	def __init__(self, shops, services):
		self.shops = shops
		self.services = services

	@staticmethod
	def configure(config):
		shops = None
		services = None

		for shop in config.get("shops"):
			shops.append(Shop(config))

		for service in config.get("service"):
			services.append(Service(config))

		return Shopsync(shops, services)

	

class Shop:
	def __init__(self, config):
		self.url = config.get('url')
		self.modules = config.get('modules')
		
		# register default services
		self.data = DataService(self)
		self.io = IoService(self)


class MyService:
	def __init__(self, config):
		self.config = config
		self.shop = None

	def initialize(self):
		self.shop = self.conf





## in Ls Data service .py

class DataService:
	def __init__(self, shop):
		self.shop = shop
		self.modules = {
			"product" : LsData(shop, "product"),
			"metafields": NonCatalogLsData(shop, "metadata")
		}

	def get_all_flatten:
		for m in self.modules.values()
			df = m.get_all_flatten(df)


class LsData():
	def __init__(self, shop, module):
		self.shop = shop
		self.module = module

	def get_flatten(self, df):
		return df[self.module]._flatten()



## in Io Service .py


class IoService:
	def __init__(self, shop):
		self.shop = shop
		self.modules = {
			"product" : LSEndpoint(self.shop.url, 'product')
		}

	def get(self, module):
		return self.module.get(module)


class LsEndpointProvider():
	def __init__(self, url, module):
		self.modules = {
			"product" : {
				"single": "product",
				"multiple": "products",
				"class": LsEndPoint
			}
		}


class LsEndPoint():
	def __init__(self, url, single, multiple):
		self.url = url
		self.single = single
		sefl.multiple = multiple

	def create(self):
		pass


class DifferentLsEndtpoint(LsEndPoint):
	def __init__(self, url, single, multiple):
		super()

	def create(self):
		print("something else"):



#########

config_file = {
	"shops" : [
	 	{
	 		"id": 1,
	 		"url": "https://www.shop1.come"
	 	}
	],
	"services" : [ 
		{
			"name": "google_feed",
			"shop_id": 1
		}
	]	
}


session = ShopSync.configure()















