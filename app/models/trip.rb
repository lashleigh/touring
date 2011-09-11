class Trip
  include MongoMapper::Document
  #before_validation :handle_user

  key :title, String
  key :summary, String
  key :tags, Array

  key :start_location, String
  key :start_date, Date
  key :finish_location, String
  key :finish_date, Date
  key :complete, Boolean, :default => false
  key :center, Array
  timestamps!

  key :user_id, ObjectId
  key :place_ids, Array
  key :partners, Array

  many :places, :in => :place_ids
  many :days, :dependent => :destroy
  many :users, :in => :partners
  belongs_to :user
  validates_presence_of :title, :user_id, :start_location

  def ordered_days
    days = []
    current_day = self.days.where(:prev_id => nil).first
    days.push(current_day)
    while current_day.next_id
      current_day = current_day.next_day
      days.push(current_day)
    end
    days
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

  def calculate_center
    Geocoder::Calculations::geographic_center([start_location, finish_location])
  end

  def cumulative_distance(index, options={})
    dist = (days[0..index].map{|d| d.distance}).sum
    options[:unit_system] ||= "METRIC"
    if options[:unit_system] == "METRIC"
      (dist/ 1000).round(1).to_s + " km"
    else 
      ((dist/ 1000) * 0.621371192).round(1).to_s+" mi";
    end
  end
  private
end
