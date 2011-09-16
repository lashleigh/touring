class Trip
  include MongoMapper::Document
  after_create :calculate_start_coords

  key :title, String
  key :summary, String
  key :tags, Array

  key :start_location, String
  key :start_coords, Array
  key :start_date, Date
  key :finish_location, String
  key :finish_date, Date
  key :complete, Boolean, :default => false
  timestamps!

  key :place_ids, Array
  key :partners, Array

  many :places, :in => :place_ids
  many :days, :dependent => :destroy
  many :users, :in => :partners
  belongs_to :user
  validates_presence_of :title, :start_location

  # this method is called on a single instance
  def as_json(options={})
    options[:methods] ||= []
    options[:methods] += [:ordered_days, :distance, :last_day]
    super(options)
  end
  def to_json(options={})
    options[:methods] ||= []
    options[:methods] += [:ordered_days, :distance, :last_day]
    super(options)
  end
  def ordered_days
    days = []
    unless self.days.empty?
      current_day = self.days.where(:prev_id => nil).first
      days.push(current_day)
      while current_day.next_id
        current_day = current_day.next_day
        days.push(current_day)
      end
    end
    return days
  end
  def last_day
    self.days.where(:next_id => nil).first
  end
  def potential_next_day_coords(options={})
    
  end

  def distance
    (days.map {|d| d.distance}).sum
  end

  def trip_day_tags
    t = {}
    days.each do |d|
      t.merge!(d.tags) {|k, old, new| old.to_i+new.to_i}
    end
   return t 
  end

  def cumulative_distance(index, options={})
    dist = (ordered_days[0..index].map{|d| d.distance}).sum
    options[:unit_system] ||= "METRIC"
    if options[:unit_system] == "METRIC"
      (dist/ 1000).round(1).to_s + " km"
    else 
      ((dist/ 1000) * 0.621371192).round(1).to_s+" mi";
    end
  end
  def final_bearing(options={})
    # set default options
    options[:method] = :linear unless options[:method] == :spherical

    # convert to coordinate arrays
    point1 = Geocoder::Calculations::extract_coordinates(self.last_day.prev_day)
    point2 = Geocoder::Calculations::extract_coordinates(self.last_day)

    # convert degrees to radians
    point1 = Geocoder::Calculations::to_radians(point1)
    point2 = Geocoder::Calculations::to_radians(point2)

    # compute deltas
    dlat = point2[0] - point1[0]
    dlon = point2[1] - point1[1]

    case options[:method]
    when :linear
      y = dlon
      x = dlat

    when :spherical
      y = Math.sin(dlon) * Math.cos(point2[0])
      x = Math.cos(point1[0]) * Math.sin(point2[0]) -
          Math.sin(point1[0]) * Math.cos(point2[0]) * Math.cos(dlon)
    end

    bearing = Math.atan2(x,y)
    # Answer is in radians counterclockwise from due east.
    # Convert to degrees clockwise from due north:
    # (90 - to_degrees(bearing) + 360) % 360
  end
  def best_append_coords(options = {})
    options[:distance] ||= Geocoder::Calculations::distance_to_radians(self.last_day.distance / 1000, {:units => :km})
    options[:bearing] ||= self.final_bearing #Geocoder::Calculations::bearing_between(self.last_day.prev_day, self.last_day)
    lat1, lng1 = Geocoder::Calculations::to_radians(self.last_day.stop_coords)
    dLat = options[:distance]*Math.cos(options[:bearing]);
    lat2 = lat1 + dLat;
    dPhi = Math.log(Math.tan(lat2/2+Math::PI/4)/Math.tan(lat1/2+Math::PI/4));
    unless dPhi==0 
      q = dLat/dPhi
    else
      q = Math.cos(lat1)
    end
    #q = (!isNaN(dLat/dPhi)) ? dLat/dPhi : Math.cos(lat1)  # E-W line gives dPhi=0

    dLng = options[:distance]*Math.sin(options[:bearing])/q;
    # check for some daft bugger going past the pole, normalise latitude if so
    if (lat2.abs > Math::PI/2) 
      lat2 = lat2>0 ? Math::PI-lat2 : -(Math::PI-lat2);
    end
    lng2 = (lng1+dLng+Math::PI)%(2*Math::PI) - Math::PI; 
    return Geocoder::Calculations::to_degrees([lat2, lng2])
  end

  private
  def calculate_start_coords
    self.start_coords = Geocoder.coordinates(start_location)
  end
end
