module DaysHelper
  def gmap(venues)
    basic = "http://maps.googleapis.com/maps/api/staticmap?size=175x150&maptype=roadmap&markers=color:blue|"
    pairs = venues.collect{|d| d.coords[0].to_s+","+d.coords[1].to_s}
    pairs = pairs.join('|')
    basic+pairs+"&sensor=false"
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
