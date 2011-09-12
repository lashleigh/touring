class Locatable
  include MongoMapper::Document

  key :address, String
  key :coords, Array

  ensure_index [[:coords,'2d']]
  def coords=(x)
    if String === x and !x.blank?
      super(ActiveSupport::JSON.decode(x))
    else
      super(x)
    end
  end
 
  def geocode
    self.coords = Geocoder.coordinates(address)
  end
  def reverse_geocode
    self.address = Geocoder.address(coords)
  end
end
