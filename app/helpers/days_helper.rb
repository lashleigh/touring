module DaysHelper
  def gmap_day(path)
    basic = 'http://maps.googleapis.com/maps/api/staticmap?size=280x280&path=weight:5|color:0x00000099|enc:'
    basic+path+"&sensor=false"
  end
end
