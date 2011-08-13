class Trip
  include MongoMapper::Document
  #before_validation :handle_user

  key :title, String
  key :summary, String
  key :tags, Array
  key :distance, Float

  key :start_location, String
  key :start_date, Date
  key :finish_location, String
  key :finish_date, Date
  key :complete, Boolean, :default => false
  timestamps!

  key :user_id, ObjectId
  key :waypoint_ids, Array
  key :day_ids, Array, :default => []
  key :partners, Array

  many :waypoints, :in => :waypoint_ids
  many :days, :in => :day_ids, :dependent => :destroy
  many :users, :in => :partners
  belongs_to :user
  validates_presence_of :title, :user_id, :start_location

  def calc_length
    (days.map {|d| d.distance}).sum
  end

  def trip_day_tags
    t = {}
    days.each do |d|
      t.merge!(d.tags) {|k, old, new| old.to_i+new.to_i}
    end
   return t #.map{|k,v| v == 1 ? Tag.find(k).name : Tag.find(k).name + "x"+v.to_s}
  end

  private
end
