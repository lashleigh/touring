Factory.define :trip do |t|  
  t.sequence(:title) { |n| "foo#{n}" }  
  t.start_location "Seattle, WA"
  t.finish_location "Portland, OR"
  t.user_id "4e2902768c4f25256200002f"
end  

Factory.define :day do |d|
  d.sequence(:stop_location) {|n| "town#{n}"}
end
