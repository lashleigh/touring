module DaysHelper
  def gmap_day(path)
    basic = 'http://maps.googleapis.com/maps/api/staticmap?size=280x280&path=weight:6|color:0x00000099|enc:'
    basic+path+"&sensor=false"
  end

  def trip_day_path(trip, day)
    i = trip.day_ids.index(day.id)
    "/trips/#{trip.id}/days/#{i}"
  end

  def edit_trip_day_path(trip, day)
    i = trip.day_ids.index(day.id)
    "/trips/#{trip.id}/days/#{i}/edit"
  end

  def new_trip_day_path(trip)
    "/trips/#{trip.id}/days/new"
  end

end
