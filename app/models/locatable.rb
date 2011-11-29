class Locatable
  include MongoMapper::Document
  include Geocoder::Model::MongoMapper

  key :address, String
  key :coordinates, Array
  reverse_geocoded_by :coordinates
  #after_validation :reverse_geocode
  #ensure_index [[:coordinates, '2d']]

  def coordinates=(x)
    if String === x and !x.blank?
      super(ActiveSupport::JSON.decode(x))
    else
      super(x)
    end
  end

 def to_coordinates
  coordinates.reverse
 end 
 
 def self.within(bounds)
   bounds = extract_bounds(bounds)
   where(:coordinates => {'$within' => {'$box' => bounds}})
 end
 def self.extract_bounds(bounds) 
   if bounds.length === 4
     b = []
     bounds.each_slice(2) {|a| b.push(a.reverse)}
     b
   elsif bounds.length === 2
     bounds
   end
 end
 def bounding_box(radius=25, options={})
   Geocoder::Calculations::bounding_box(self, radius, options={})
 end
end
