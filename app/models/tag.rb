class Tag
  include MongoMapper::Document
  #before_save :name_to_lower

  key :name, String, :required => true
  key :count, Integer, :default => 0

  validates_length_of :name, :minimum => 1
  validates_numericality_of :count

  def parse_tag_array(tags)
    res = {}
    r1 = Regexp.new('.x\d+$')
    tags.each do |t|
      if r1.match(t) 
        match_array = r1.match(t).string.rpartition("x")
        tag = Tag.find_or_create_by_name(match_array[0].downcase)
        tag.count += match_array[2].to_i
        tag.save
        res[tag.id] = match_array[2]
      else
        tag = Tag.find_or_create_by_name(t.downcase)
        tag.count += 1
        tag.save
        res[tag.id] = 1
      end
    end
    return res
  end

  private
  def name_to_lower
    name.downcase!
  end
end
