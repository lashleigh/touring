class User
  include MongoMapper::Document

  key :name, String
  key :uid, String
  key :provider, String

  #many :trips
  #many :days, :through => :trips

  def self.create_with_omniauth(auth)  
    user = User.new
    user.save
    user.set(
      :provider => auth["provider"],
      :uid => auth["uid"],
      :name => auth["user_info"]["name"]  
    )
    return user
  end 
end
