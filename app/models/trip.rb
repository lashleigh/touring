class Trip
  include MongoMapper::Document
  #after_create :calculate_start_coords

  key :title, String
  key :summary, String
  key :tags, Array

  key :start_coords, Array
  key :start_location, String
  key :start_date, Date
  key :complete, Boolean, :default => false
  timestamps!

  key :partners, Array
  many :days, :dependent => :destroy
  many :users, :in => :partners
  belongs_to :user

  def start_coords=(x)
    if String === x and !x.blank?
      super(ActiveSupport::JSON.decode(x))
    else
      super(x)
    end
  end
  
  def serializable_hash(options = {})
    options ||= {}
    super({:methods => [:best_append_coords]}.merge(options))
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

  def cumulative_distances(days = nil)
    days ||= self.ordered_days
    distances = []
    sum = 0
    days.each_with_index do |d, i|
      sum += d.distance
      distances[i] = sum
    end
    return distances
  end
  def average_distance
    if days.length > 0
      days.map{|d| d.distance}.sum / days.length 
    else 
      return 0.0
    end
  end
  def best_append_coords
    unless self.ordered_days.length < 2
      distance = Geocoder::Calculations::distance_to_radians(self.average_distance/1621.371192)
      bearing = Geocoder::Calculations::to_radians(Geocoder::Calculations::bearing_between(self.last_day.prev_day, self.last_day))
      lat1, lng1 = Geocoder::Calculations::to_radians(self.last_day.stop_coords)
      dLat = distance*Math.cos(bearing);
      lat2 = lat1 + dLat;
      dPhi = Math.log(Math.tan(lat2/2+Math::PI/4)/Math.tan(lat1/2+Math::PI/4));
      unless dPhi==0 
        q = dLat/dPhi
      else
        q = Math.cos(lat1)
      end

      dLng = distance*Math.sin(bearing)/q;
      # check for some daft bugger going past the pole, normalise latitude if so
      if (lat2.abs > Math::PI/2) 
        lat2 = lat2>0 ? Math::PI-lat2 : -(Math::PI-lat2);
      end
      lng2 = (lng1+dLng+Math::PI)%(2*Math::PI) - Math::PI; 
      return Geocoder::Calculations::to_degrees([lat2, lng2])
    end
  end

  private
  def calculate_start_coords
    self.start_coords = Geocoder.coordinates(start_location)
  end
end
