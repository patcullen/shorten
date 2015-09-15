class Counter
  include Mongoid::Document

  field :name, type: String
  field :value, type: Integer

end
