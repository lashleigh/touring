class User
  include MongoMapper::Document

  key :name, String
  key :uid, String
  key :provider, String
  key :trip_ids, Array
  key :website, String
  key :location, String
  key :unit_system, String, :default => "IMPERIAL"
  #key :contacts, Array

  many :trips, :in => :trip_ids
  many :days, :through => :trips
  #many :users, :in => :contacts
  timestamps!

  def self.create_with_omniauth(auth)  
    user = User.new
    user.save
    user.set(
      :provider => auth["provider"],
      :uid => auth["uid"],
      :name => auth["user_info"]["name"],
      :location => auth["user_info"]["location"]
    )
    return user
  end 

  def completed(bool)
    #trips.count { |t| t.complete == bool}
    trips.map {|t| t.complete}.count(bool)
  end
end
