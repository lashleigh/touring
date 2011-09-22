class User
  include MongoMapper::Document
  safe

  key :name, String
  key :location, String
  key :email, String
  key :website, String
  key :description, String
  key :image, String
  key :unit_system, String, :default => "IMPERIAL"
  timestamps!

  many :authorizations
  many :trips
  many :days, :through => :trips

  def self.create_with_omniauth(auth)  
    user = User.new(:name => auth["user_info"]["name"], 
                    :location => auth["user_info"]["location"], 
                    :email => auth["user_info"]["email"],
                    :description => auth["user_info"]["description"],
                    :image => auth["user_info"]["image"]
                   )
                    #:website => auth["user_info"]["urls"].first.last,
    user.authorizations.push(Authorization.new(:provider => auth["provider"], :uid => auth["uid"]))
    user.save
    return user
  end 

  def self.find_by_authorization(provider, uid)
    u = where('authorizations.provider' => provider, 'authorizations.uid' => uid).first
    u.save if u
    return u
  end

  def user_tags
    user_tags = {}
    trips.each do |t|
      user_tags.merge!(t.trip_day_tags) {|k, old, new| old.to_i+new.to_i}
    end
    return user_tags
  end

  def completed(bool)
    #trips.count { |t| t.complete == bool}
    trips.map {|t| t.complete}.count(bool)
  end
end
