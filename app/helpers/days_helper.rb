module DaysHelper
  def gmap(venues)
    basic = "http://maps.googleapis.com/maps/api/staticmap?size=175x150&maptype=roadmap&markers=color:blue|"
    pairs = venues.collect{|d| d.coords[0].to_s+","+d.coords[1].to_s}
    pairs = pairs.join('|')
    basic+pairs+"&sensor=false"
  end
end
